
# Each test function receives `client` as a parameter.
# pytest sees it matches the fixture name in conftest.py and injects it automatically.
# `client` already has the test DB wired in — you don't have to do anything extra.


def make_issue(client, auth_header, **overrides):
    payload = {
        "title": "Test issue",
        "description": "This is a test description",
        "priority": "high",
        "status": "open",
        **overrides
    }
    response = client.post("/api/v1/issues", json=payload, headers=auth_header)

    return response.json()


def test_create_issue(client, auth_header):
    response = client.post("/api/v1/issues", json={
        "title": "Test issue",
        "description": "This is a test description",
        "priority": "high",
        "status": "open",
    }, headers=auth_header)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test issue"
    assert data["priority"] == "high"
    assert "id" in data  # DB assigned an id


def test_get_issues_empty(client):
    response = client.get("/api/v1/issues")
    assert response.status_code == 200
    assert response.json() == []


def test_get_issues(client, auth_header):
    issue = make_issue(client, auth_header)
    response = client.get('/api/v1/issues')
    assert response.status_code == 200
    assert len(response.json()) == 1
    data = response.json()[0]
    assert data['id'] == issue['id']
    assert data['title'] == issue['title']
    assert data['description'] == issue['description']
    assert data['priority'] == issue['priority']
    assert data['status'] == issue['status']


def test_get_issue(client, auth_header):
    issue = make_issue(client, auth_header)
    response = client.get(f"/api/v1/issues/{issue['id']}")
    assert response.status_code == 200
    data = response.json()
    assert data['id'] == issue['id']
    assert data['title'] == issue['title']
    assert data['description'] == issue['description']
    assert data['priority'] == issue['priority']
    assert data['status'] == issue['status']


def test_update_issue(client, auth_header):
    issue = make_issue(client, auth_header)
    response = client.patch(f"/api/v1/issues/{issue['id']}", json={
        "title": "Updated title",
        "description": "Updated description",
        "priority": "medium",
        "status": "in_progress",
    }, headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert data['id'] == issue['id']
    assert data['title'] == "Updated title"
    assert data['description'] == "Updated description"
    assert data['priority'] == "medium"
    assert data['status'] == "in_progress"


def test_delete_issue(client, auth_header):
    issue = make_issue(client, auth_header)
    response = client.delete(
        f"/api/v1/issues/{issue['id']}", headers=auth_header)
    assert response.status_code == 200
    response = client.get(f"/api/v1/issues/{issue['id']}")
    assert response.status_code == 404
    assert response.json() == {"detail": "Issue not found"}


def test_get_issue_not_found(client, auth_header):
    response = client.get("/api/v1/issues/999999", headers=auth_header)
    assert response.status_code == 404
    assert response.json() == {"detail": "Issue not found"}


def test_update_issue_not_found(client, auth_header):
    response = client.patch("/api/v1/issues/999999", json={
        "title": "Updated title",
        "description": "Updated description",
        "priority": "medium",
        "status": "in_progress",
    }, headers=auth_header)
    assert response.status_code == 404
    assert response.json() == {"detail": "Issue not found"}


def test_delete_issue_not_found(client, auth_header):
    response = client.delete("/api/v1/issues/999999", headers=auth_header)
    assert response.status_code == 404
    assert response.json() == {"detail": "Issue not found"}


def test_create_issue_requires_auth(client):
    response = client.post('/api/v1/issues', json={
        "title": "Test issue",
        "description": "This is a test description",
        "priority": "high",
        "status": "open",
    }
    )
    assert response.status_code == 401


def test_create_issue_with_auth(client, auth_header):
    response = client.post('/api/v1/issues', json={
        "title": "Test issue",
        "description": "This is a test description",
        "priority": "high",
        "status": "open",
    }, headers=auth_header
    )
    assert response.status_code == 201
