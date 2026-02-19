export interface User {
  _id?: string;
  id?: string; // Alias
  name: string;
  email: string;
  passwordHash: string;
  faceDescriptor: number[] | null;
  role: 'USER' | 'ADMIN';
  orgId?: string;
  hasVoted: boolean;
  kycVerified: boolean;
  kyc?: {
    status: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
    fullName?: string;
    idNumber?: string;
    submittedAt?: number;
    reviewedAt?: number;
  };
}

export interface Candidate {
  id: string;
  name: string;
  party: string;
  imageUrl?: string;
}

export interface Election {
  _id?: string;
  id?: string; // Alias for frontend compatibility
  title: string;
  candidates: Candidate[];
  status: 'OPEN' | 'CLOSED' | 'ACTIVE';
  startTime: number;
  endTime?: number;
  startDate?: Date;
  endDate?: Date;
  createdBy?: string;
}

export interface Vote {
  _id?: string;
  id?: string;
  electionId: string;
  candidateId: string;
  voterId: string;
  transactionHash: string;
  voteCode: string;
  blockNumber: number;
  timestamp: number;
}

export interface Block {
  _id?: string;
  index: number;
  timestamp: number;
  transactions: Vote[];
  previousHash: string;
  hash: string;
  nonce: number;
}
