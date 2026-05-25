# TASK_MANAGEMENT_JIRA

TaskFlow | Simple Task Management App

TaskFlow is a task management application like Jira or Trello. Users can create tasks, assign work, track progress, and manage daily activities easily.

The project is built using Node.js, Express.js, MongoDB, Angular 21, and Tailwind CSS. It has a clean UI with Kanban boards, task lists, dashboard reports, and a comment system.

🚀 Features
Login and signup with secure authentication
Role-based access (Admin and Member)
Kanban Board with task statuses:
Todo
In Progress
Review
Done
List view for managing tasks in table format
Dashboard with task statistics and progress tracking
Add, edit, and delete comments on tasks
Search and filter tasks by:
Status
Priority
Assignee
Due date
Responsive dark UI with modern design
Technology Used

Backend
Node.js with TypeScript
Express.js (MVC + Repository pattern)
MongoDB with Mongoose
JWT Authentication
BcryptJS for password hashing
Express Validator
Morgan Logger
Frontend

Angular 21
Angular Signals
Tailwind CSS v4
HttpClient API Integration



Database Collections

The project uses 3 main collections:

Users

Stores user details:

Name
Email
Password
Role
Tasks

Stores task information:

Title
Description
Status
Priority
Assignee
Due date
Labels
Comments

Stores task comments:

Task ID
User ID
Comment text
🔒 Security
Passwords are encrypted using Bcrypt
JWT token authentication is used
Protected APIs for logged-in users only
Role-based permissions for Admin and Member users
Admin Permissions
Can assign tasks to anyone
Can delete any comment
Can manage all tasks
Member Permissions
Can manage their own tasks
Can update only task status if task belongs to another user
Can edit/delete only their own comments

 API Endpoints

Authentication
POST /auth/register
POST /auth/login
POST /auth/logout
Users
GET /users
GET /users/me
Tasks
GET /tasks
GET /tasks/:id
POST /tasks
PUT /tasks/:id
DELETE /tasks/:id
GET /tasks/dashboard
Comments
POST /comments
PUT /comments/:id
DELETE /comments/:id


Installation Steps
Backend Setup
cd backend
npm install

Copy `backend/.env.example` to `backend/.env` and set `JWT_SECRET`.

Start MongoDB (Windows, run once before the server):

npm run db:start

Requires PowerShell as Administrator if the service is stopped.

Start backend server (development with hot reload):

npm run dev

Or build and run production:

npm run build
npm start

Backend runs on:

http://localhost:5001
Frontend Setup
cd frontend
npm install
npm start

Frontend runs on:

http://localhost:4200
