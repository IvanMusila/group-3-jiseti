def test_signup(client):
    response = client.post("/auth/signup", json={
        "username": "chadwin",
        "email": "chadwin@example.com",
        "password": "password123"
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data["msg"] == "User created successfully"

def test_duplicate_signup(client):
    # First signup
    client.post("/auth/signup", json={
        "username": "antony",
        "email": "antony@example.com",
        "password": "password123"
    })
    
    # Second signup with same email
    response = client.post("/auth/signup", json={
        "username": "antony2",
        "email": "antony@example.com",
        "password": "password123"
    })
    assert response.status_code == 400
    data = response.get_json()
    assert "Email already registered" in data["error"]

def test_login(client):
    # First signup
    client.post("/auth/signup", json={
        "username": "mathias",
        "email": "mathias@example.com",
        "password": "password123"
    })
    
    # Then login
    response = client.post("/auth/login", json={
        "email": "mathias@example.com",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.get_json()
    assert data["msg"] == "Login successful"
    assert "token" in data

def test_protected_route(client):
    # Signup and login
    client.post("/auth/signup", json={
        "username": "ivan",
        "email": "ivan@example.com",
        "password": "password123"
    })
    
    login_response = client.post("/auth/login", json={
        "email": "ivan@example.com",
        "password": "password123"
    })
    token = login_response.get_json()["token"]

    # Access protected route
    response = client.get("/auth/profile", headers={
        "Authorization": f"Bearer {token}"
    })
    assert response.status_code == 200
    data = response.get_json()
    assert data["email"] == "ivan@example.com"