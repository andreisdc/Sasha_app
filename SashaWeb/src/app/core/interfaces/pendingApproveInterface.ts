export interface PendingApprove {
  userId: string;
  firstName: string;
  lastName: string;
  cnp: string;
  photo?: string;
  status: 'pending' | 'approved' | 'rejected';
  failReason?: string;
  createdAt: Date;
}

export interface RejectRequest {
  reason: string;
}