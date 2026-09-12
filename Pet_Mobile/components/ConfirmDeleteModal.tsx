import React from 'react';
import { AppDialog } from './ui/AppDialog';

interface ConfirmDeleteModalProps {
  visible: boolean;
  petName: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  visible,
  petName,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <AppDialog
      visible={visible}
      variant="destructive"
      iconName="trash-outline"
      title="Xác nhận xóa thú cưng"
      message={`Bạn có chắc muốn xóa bé ${petName || 'thú cưng'} khỏi danh sách thú cưng của bạn? Hành động này không thể hoàn tác.`}
      confirmText="Xóa thú cưng"
      cancelText="Hủy"
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};
