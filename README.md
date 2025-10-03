# Jiseti – Civic Engagement Platform

# Description
Jiseti is a full-stack web application that empowers citizens to report corruption-related incidents (**red-flags**) or request urgent government action (**interventions**). It promotes **transparency and accountability** by allowing administrators to track, verify, and update the status of reports, while citizens remain informed throughout the process. The platform bridges the gap in Africa’s development challenges by providing an accessible way to report corruption, request interventions (e.g., bad roads, collapsed bridges, flooding), and track progress to hold authorities accountable. Users can submit reports with supporting evidence, and administrators oversee case statuses.

---

## 🚨 Problem Statement
Corruption and poor service delivery are key challenges to Africa’s development. Citizens often lack transparent and accessible platforms to:
- Report corruption,
- Request interventions (e.g., bad roads, collapsed bridges, flooding),
- Track progress and hold authorities accountable.

**Jiseti** bridges this gap by enabling citizens to submit reports with supporting evidence, while administrators oversee cases and update statuses.

---

## Tools Used

**Backend**: Python, Flask, SQLAlchemy, Flask-Migrate, Psycopg (PostgreSQL adapter), Passlib (for password hashing)
**Frontend**: React, Redux, Tailwind CSS
**Database**: PostgreSQL
**Other**: Alembic (for migrations), virtualenv (for Python environment management), GitHub Actions, Figma for UI/UX


## Complete Setup Instructions

  ### Clone the Repository:
    git clone https://github.com/yourusername/jiseti.git
    cd jiseti


## Set Up the Virtual Environment:

    On Unix/MacOS:python3 -m venv venv
    source venv/bin/activate


    On Windows:python -m venv venv
    venv\Scripts\activate


## Install Dependencies:

    Backend:cd backend
    pip install -r requirements.txt


    Frontend:cd ../frontend
    npm install




## Configure Environment:

Create a .env file in the backend directory with:DATABASE_URL=postgresql+psycopg://postgres:your_password@localhost:5432/jiseti_test
SECRET_KEY=your_secret_key_here


Replace your_password and your_secret_key_here with secure values.
Ensure PostgreSQL is installed and the jiseti_test database is created:createdb -U postgres jiseti_test




## Apply Database Migrations:
    cd backend
    flask db upgrade


## Build the Frontend:
    cd ../frontend
    npm run build



## How to Run Your App

  Start the Backend:

  From the backend directory:python app.py

    The app will run locally on http://127.0.0.1:5000. 
    For the deployed version, use: https://jiseti-backend-zt8g.onrender.com/.

  Start the Frontend:

  From the frontend directory:npm start

    The app will run locally on http://localhost:3000. 
    For the deployed version, use: https://jiseti-frontend-w02k.onrender.com/.


## Test the API:

    Register a user:curl -v -H "Content-Type: application/json" -d '{"username":"testuser","email":"test@example.com","password":"password"}' http://localhost:5000/auth/register


## Log in and create reports via the frontend or API endpoints.



## Screenshots
Dashboard: 
![WhatsApp Image 2025-10-03 at 18 01 58](https://github.com/user-attachments/assets/270989d7-9c8f-4849-b1cc-f0d2ff7122ed)
Report Creation: 
![WhatsApp Image 2025-10-03 at 18 01 48](https://github.com/user-attachments/assets/cfd00464-443a-4f59-a7ca-a8238ed9f03f)



## Authors / Acknowledgement

Chadwin Uhuru - Contributor
Ivan Musila - Contributor
Mathias Munene - Lead Developer
Antony Kiarie - Contributor
Special thanks to the xAI community and our teammates for support and collaboration.

## LICENSE
This project is licensed under the MIT License. See the LICENSE file for details.

##front-end
https://jiseti-frontend-w02k.onrender.com/

##back-end
https://jiseti-backend-zt8g.onrender.com/

---
