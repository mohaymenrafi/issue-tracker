def make_project(client, auth_header, **overrides):
    payload = {
        "name": "Test project",
        "description": "This is a test project description",
        **overrides,
    }

    response = client.post(
        "/api/v1/projects", json=payload, headers=auth_header)

    return response.json()


# create a project
def test_create_project(client, auth_header):
    response = client.post("/api/v1/projects", json={
        "name": "Test project",
        "description": "test description for project 01"
    }, headers=auth_header)

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test project"


# create a project error for auth
def test_create_project_without_auth(client):
    response = client.post("/api/v1/projects", json={
        "name": "Test project",
        "description": "test description for project 01"
    })
    assert response.status_code == 401


# get all projects
def test_get_all_projects(client, auth_header):
    project = make_project(client, auth_header)
    response = client.get('/api/v1/projects', headers=auth_header)
    assert response.status_code == 200
    assert len(response.json()) == 1
    data = response.json()[0]
    assert data["id"] == project["id"]
    assert data["name"] == project["name"]


def test_get_projects_without_auth(client):
    response = client.get("/api/v1/projects")
    assert response.status_code == 401


# get empty projects
def test_get_empty_project(client, auth_header):
    response = client.get('/api/v1/projects', headers=auth_header)
    assert response.status_code == 200
    assert len(response.json()) == 0


# get a single project
def test_get_single_project(client, auth_header):
    project = make_project(client, auth_header)
    response = client.get(
        f"/api/v1/projects/{project['id']}", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert data['id'] == project['id']
    assert data['name'] == project['name']


def test_get_single_project_without_auth(client, auth_header):
    project = make_project(client, auth_header)
    response = client.get(f"/api/v1/projects/{project['id']}")
    assert response.status_code == 401


def test_get_project_not_found(client, auth_header):
    response = client.get('/api/v1/projects/234234', headers=auth_header)
    assert response.status_code == 404
    assert response.json() == {"detail": "Project not found"}


def test_update_project(client, auth_header):
    project = make_project(client, auth_header)
    response = client.patch(
        f"/api/v1/projects/{project['id']}",
        json={"name": "Updated name", "description": "Updated description"},
        headers=auth_header,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == project["id"]
    assert data["name"] == "Updated name"
    assert data["description"] == "Updated description"


def test_update_project_not_found(client, auth_header):
    response = client.patch(
        "/api/v1/projects/999999",
        json={"name": "Updated name"},
        headers=auth_header,
    )
    assert response.status_code == 404
    assert response.json() == {"detail": "Project not found"}


def test_update_project_forbidden_non_owner(
    client, auth_header, other_auth_header
):
    project = make_project(client, auth_header)
    response = client.patch(
        f"/api/v1/projects/{project['id']}",
        json={"name": "Hacked"},
        headers=other_auth_header,
    )
    assert response.status_code == 403
    assert response.json() == {
        "detail": "Only the project owner can update the project",
    }


def test_delete_project(client, auth_header):
    project = make_project(client, auth_header)
    response = client.delete(
        f"/api/v1/projects/{project['id']}", headers=auth_header)
    assert response.status_code == 200
    assert response.json() == {"message": "Project deleted successfully"}
    response = client.get(
        f"/api/v1/projects/{project['id']}", headers=auth_header)
    assert response.status_code == 404
    assert response.json() == {"detail": "Project not found"}


def test_delete_project_not_found(client, auth_header):
    response = client.delete("/api/v1/projects/999999", headers=auth_header)
    assert response.status_code == 404
    assert response.json() == {"detail": "Project not found"}


def test_delete_project_forbidden_non_owner(
    client, auth_header, other_auth_header
):
    project = make_project(client, auth_header)
    response = client.delete(
        f"/api/v1/projects/{project['id']}", headers=other_auth_header)
    assert response.status_code == 403
    assert response.json() == {
        "detail": "Only the project owner can delete the project",
    }
