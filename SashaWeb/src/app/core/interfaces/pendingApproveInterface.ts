export interface PendingApprove {
  id: string;
  firstName: string;
  lastName: string;
  cnp: string; // mascat în listă, complet doar la creare
  address?: string;
  photo?: string;
  status: 'pending' | 'approved' | 'rejected';
  failReason?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface RejectRequest {
  reason: string;
}
