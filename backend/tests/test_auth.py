def test_signup_and_login(client):
    # signup
    r = client.post("/auth/signup", json={"username":"a","email":"a@test.com","password":"pw"})
    assert r.status_code == 201
    # login
    r2 = client.post("/auth/login", json={"email":"a@test.com","password":"pw"})
    assert r2.status_code == 200
    data = r2.get_json()
    assert "token" in data
