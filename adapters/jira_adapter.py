"""
Jira Adapter — Hermes Agent interface to Jira Cloud REST API.

Usage:
    jira = JiraAdapter(
        email="user@email.com",
        token="ATATT3xFfGF...",
        base_url="https://your-domain.atlassian.net"
    )
    jira.create_issue(project="SCRUM", type="Task", summary="...")
    jira.search_issues(jql='project = SCRUM')
    jira.comment_issue("SCRUM-123", "done")
    jira.move_issue("SCRUM-123", "In Progress")

Architecture:
    Hermes Agent → JiraAdapter (this file) → httpx → Jira Cloud REST API
"""

import httpx
import base64
import json
from typing import Optional, Any
from dataclasses import dataclass, field


# ──────────────────────────────────────────────
#  Helpers
# ──────────────────────────────────────────────

def _make_auth_header(email: str, token: str) -> str:
    raw = f"{email}:{token}"
    return f"Basic {base64.b64encode(raw.encode()).decode()}"


def _atlassian_doc(text: str) -> dict:
    """Wrap plain text into Atlassian Document Format (ADF)."""
    return {
        "type": "doc",
        "version": 1,
        "content": [
            {
                "type": "paragraph",
                "content": [{"type": "text", "text": text}],
            }
        ],
    }


def _atlassian_doc_from_lines(lines: list[str]) -> dict:
    """Wrap multiple lines into ADF paragraph blocks."""
    content = [
        {"type": "paragraph", "content": [{"type": "text", "text": line}]}
        for line in lines
    ]
    return {"type": "doc", "version": 1, "content": content}


# ──────────────────────────────────────────────
#  Main adapter
# ──────────────────────────────────────────────

class JiraError(Exception):
    """Wraps a non-2xx Jira response with status code + detail."""

    def __init__(self, status: int, detail: str):
        self.status = status
        self.detail = detail
        super().__init__(f"[{status}] {detail}")


class JiraAdapter:
    """Thin wrapper over Jira Cloud REST API v3."""

    def __init__(
        self,
        email: str,
        token: str,
        base_url: str = "https://student-team7-petsnap.atlassian.net",
        timeout: int = 15,
    ):
        self.base_url = base_url.rstrip("/")
        auth_value = _make_auth_header(email, token)
        self._client = httpx.Client(
            headers={
                "Authorization": auth_value,
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            timeout=timeout,
        )

    # ── Internal helpers ──────────────────────

    def _get(self, path: str) -> dict:
        r = self._client.get(f"{self.base_url}{path}")
        if r.status_code >= 400:
            raise JiraError(r.status_code, r.text[:300])
        return r.json()

    def _post(self, path: str, body: dict) -> dict:
        r = self._client.post(f"{self.base_url}{path}", json=body)
        if r.status_code >= 400:
            raise JiraError(r.status_code, r.text[:300])
        if r.status_code == 204:
            return {}
        return r.json()

    def _put(self, path: str, body: dict) -> None:
        r = self._client.put(f"{self.base_url}{path}", json=body)
        if r.status_code >= 400:
            raise JiraError(r.status_code, r.text[:300])

    def _delete(self, path: str) -> None:
        r = self._client.delete(f"{self.base_url}{path}")
        if r.status_code >= 400:
            raise JiraError(r.status_code, r.text[:300])

    # ── Field resolution ──────────────────────

    def resolve_project_id(self, key: str) -> str:
        data = self._get(f"/rest/api/3/project/{key}")
        return data["id"]

    def resolve_issue_type_id(self, name: str) -> Optional[str]:
        types = self._get("/rest/api/3/issuetype")
        for t in types:
            if t["name"].lower() == name.lower():
                return t["id"]
        return None

    # ── Public API ─────────────────────────────

    def create_issue(
        self,
        project: str,
        type: str,
        summary: str,
        description: Optional[str] = None,
        priority: Optional[str] = None,
        assignee: Optional[str] = None,
        parent: Optional[str] = None,  # for subtasks: "SCRUM-123"
        labels: Optional[list[str]] = None,
        **extra_fields,
    ) -> dict:
        """Create a Jira issue.

        Args:
            project: Project key, e.g. "SCRUM"
            type: Issue type name, e.g. "Task", "Bug", "Subtask"
            summary: Issue title
            description: Plain text description (converted to ADF)
            priority: e.g. "High", "Medium", "Low"
            assignee: Account ID (email won't work on cloud)
            parent: Parent issue key (required for subtask type)
            labels: List of label strings
            extra_fields: Any additional field key → value pairs

        Returns:
            The created issue dict (includes "key", "id", "self")
        """
        fields: dict[str, Any] = {
            "project": {"key": project},
            "summary": summary,
            "issuetype": {"name": type},
        }

        if description:
            fields["description"] = _atlassian_doc(description)
        if priority:
            fields["priority"] = {"name": priority}
        if assignee:
            fields["assignee"] = {"accountId": assignee}
        if parent:
            fields["parent"] = {"key": parent}
        if labels:
            fields["labels"] = labels

        fields.update(extra_fields)

        return self._post("/rest/api/3/issue", {"fields": fields})

    def create_subtask(
        self,
        parent_key: str,
        summary: str,
        description: Optional[str] = None,
        **extra_fields,
    ) -> dict:
        """Shorthand: create a subtask under a parent issue."""
        return self.create_issue(
            project="",
            type="Subtask",
            summary=summary,
            description=description,
            parent=parent_key,
            **extra_fields,
        )

    def update_issue(self, issue_key: str, **fields) -> None:
        """Update one or more fields on an issue."""
        body: dict[str, Any] = {}
        if "summary" in fields:
            body["summary"] = fields.pop("summary")
        if "description" in fields:
            desc = fields.pop("description")
            body["description"] = desc if isinstance(desc, dict) else _atlassian_doc(desc)
        if "priority" in fields:
            body["priority"] = {"name": fields.pop("priority")}
        if "assignee" in fields:
            body["assignee"] = {"accountId": fields.pop("assignee")}
        if "labels" in fields:
            body["labels"] = fields.pop("labels")
        body.update(fields)

        self._put(f"/rest/api/3/issue/{issue_key}", {"fields": body})

    def move_issue(
        self,
        issue_key: str,
        target_status: str,
    ) -> None:
        """Transition an issue to a different status."""
        transitions = self._get(
            f"/rest/api/3/issue/{issue_key}/transitions"
        )
        for t in transitions.get("transitions", []):
            if t["to"]["name"].lower() == target_status.lower():
                self._post(
                    f"/rest/api/3/issue/{issue_key}/transitions",
                    {"transition": {"id": t["id"]}},
                )
                return
        ids = [t["to"]["name"] for t in transitions.get("transitions", [])]
        raise JiraError(
            400,
            f"Transition '{target_status}' not found. "
            f"Available: {', '.join(ids)}",
        )

    def comment_issue(self, issue_key: str, body_text: str) -> dict:
        """Add a comment to an issue."""
        return self._post(
            f"/rest/api/3/issue/{issue_key}/comment",
            {"body": _atlassian_doc(body_text)},
        )

    def assign_issue(self, issue_key: str, account_id: str) -> None:
        """Assign an issue to a user."""
        self._put(
            f"/rest/api/3/issue/{issue_key}/assignee",
            {"accountId": account_id},
        )

    def search_issues(
        self,
        jql: str,
        fields: Optional[list[str]] = None,
        max_results: int = 20,
    ) -> list[dict]:
        """Search issues using JQL."""
        body = {
            "jql": jql,
            "maxResults": min(max_results, 100),
        }
        if fields:
            body["fields"] = fields
        data = self._post("/rest/api/3/search/jql", body)
        return data.get("issues", [])

    def close_issue(self, issue_key: str) -> None:
        """Transition an issue to Done (or Closed)."""
        try:
            self.move_issue(issue_key, "Done")
        except JiraError:
            try:
                self.move_issue(issue_key, "Closed")
            except JiraError as e:
                raise JiraError(
                    400,
                    f"Cannot close {issue_key}: no 'Done' or 'Closed' transition. "
                    f"Detail: {e.detail}",
                )

    def get_issue(self, issue_key: str) -> dict:
        """Get full issue details."""
        return self._get(f"/rest/api/3/issue/{issue_key}")

    def get_transitions(self, issue_key: str) -> list[dict]:
        """List available transitions for an issue."""
        data = self._get(f"/rest/api/3/issue/{issue_key}/transitions")
        return data.get("transitions", [])

    def get_my_open_issues(self, jql_project: str = "SCRUM", max_results: int = 20):
        jql = f'project = {jql_project} AND status NOT IN ("Done", "Closed") ORDER BY created DESC'
        return self.search_issues(jql=jql, max_results=max_results)

    def close(self):
        self._client.close()
