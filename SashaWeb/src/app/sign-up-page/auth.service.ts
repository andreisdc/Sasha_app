import { Injectable } from '@angular/core';
import { User } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly STORAGE_KEY = 'angular_app_users';

    constructor() { }

    signUp(user: User): boolean {
        const users = this.getAllUsers();

        // Check if email or phone already exists
        const userExists = users.some(u => u.email === user.email || u.phone === user.phone);
        if (userExists) {
            return false;
        }

        users.push(user);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
        return true;
    }

    private getAllUsers(): User[] {
        const usersJson = localStorage.getItem(this.STORAGE_KEY);
        return usersJson ? JSON.parse(usersJson) : [];
    }
}