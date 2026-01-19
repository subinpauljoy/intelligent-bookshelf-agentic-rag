import pytest
from httpx import AsyncClient
from main import app

@pytest.mark.asyncio
async def test_review_lifecycle(client: AsyncClient, db_session, normal_user_token_headers, superuser_token_headers):
    # API base path
    api_v1 = "/api/v1"
    
    # 1. Setup: Create a book
    book_data = {"title": "Test Book Lifecycle", "author": "Tester", "year_published": 2024, "genre": "Test"}
    response = await client.post(f"{api_v1}/books/", json=book_data, headers=superuser_token_headers)
    assert response.status_code == 200
    book_id = response.json()["id"]

    # 2. Create Review (Normal User)
    review_data = {"rating": 5, "review_text": "Great book!"}
    response = await client.post(f"{api_v1}/reviews/book/{book_id}", json=review_data, headers=normal_user_token_headers)
    assert response.status_code == 200
    review_id = response.json()["id"]

    # 3. List Reviews
    response = await client.get(f"{api_v1}/reviews/book/{book_id}")
    assert response.status_code == 200
    reviews = response.json()
    assert len(reviews) == 1
    assert reviews[0]["id"] == review_id
    assert reviews[0]["user"]["email"] == "test@example.com"

    # 4. Duplicate Review Prevention
    response = await client.post(f"{api_v1}/reviews/book/{book_id}", json=review_data, headers=normal_user_token_headers)
    assert response.status_code == 400
    assert "already reviewed" in response.json()["detail"]

    # 5. Delete Review (Normal User - Success)
    response = await client.delete(f"{api_v1}/reviews/{review_id}", headers=normal_user_token_headers)
    assert response.status_code == 200

    # 6. Verify Deletion
    response = await client.get(f"{api_v1}/reviews/book/{book_id}")
    assert len(response.json()) == 0

    # 7. Create Another Review (for Admin Delete Test)
    response = await client.post(f"{api_v1}/reviews/book/{book_id}", json=review_data, headers=normal_user_token_headers)
    review_id_2 = response.json()["id"]

    # 8. Delete Review (Admin - Success)
    response = await client.delete(f"{api_v1}/reviews/{review_id_2}", headers=superuser_token_headers)
    assert response.status_code == 200

    # 9. Verify Admin Deletion
    response = await client.get(f"{api_v1}/reviews/book/{book_id}")
    assert len(response.json()) == 0

    # 10. Check AI Summary invalidation (optional, depends on if we want to mock LLM)
    # But we can at least check if the field is set to null in DB if we were able to test it.