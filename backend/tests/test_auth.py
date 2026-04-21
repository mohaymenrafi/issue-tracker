# tests that need to
# Register route:
# successfully register a new user
# email already in use
# wrong/missing payload
# validation errors

# Login route:
# successfully login
# invalid credentials
#


import json


def test_register(client):
    response = client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "testPassword123",
        "username": "testuser",
        "name": "Test User"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["username"] == "testuser"
    assert "hashed_password" not in data


def test_register_duplicate_email(client):
    payload = {
        "email": "test@example.com",
        "password": "testPassword123",
        "username": "testuser",
        "name": "Test User"
    }
    res_one = client.post("/api/v1/auth/register", json=payload)
    assert res_one.status_code == 201
    res_two = client.post("/api/v1/auth/register", json=payload)
    assert res_two.status_code == 400
    assert res_two.json()["detail"] == "Email already in use"


def test_login_success(client, auth_user):
    # OAuth2PasswordRequestForm expects form fields (not JSON): username + password
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": auth_user.email,
            "password": "testPassword123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


def test_login_wrong_password(client, auth_user):
    response = client.post('/api/v1/auth/login', data={
        "username": auth_user.email,
        "password": 'wrongPassword'
    })
    assert response.status_code == 401
