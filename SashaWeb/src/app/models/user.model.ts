export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string; // Note: In a real app, never store plain passwords
    createdAt: Date;
}