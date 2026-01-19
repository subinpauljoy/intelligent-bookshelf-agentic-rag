import pytest
from httpx import AsyncClient
from main import app
from sqlalchemy import text

@pytest.mark.asyncio
async def test_review_lifecycle(client: AsyncClient, db_session, normal_user_token_headers, superuser_token_headers):
    # API base path
    api_v1 = "/api/v1"
    
    # 1. Setup: Create a book
    book_data = {"title": "Test Book Lifecycle", "author": "Tester", "year_published": 2024, "genre": "Test"}
    response = await client.post(f"{api_v1}/books/", json=book_data, headers=superuser_token_headers)
    assert response.status_code == 200
    book_id = response.json()["id"]

    # 1.1 Manually set a fake AI summary to simulate a cached state
    # We need to use the DB session directly or an endpoint if available.
    # Since we don't have a direct update endpoint for this field exposed easily,
    # and using db_session in async test with client might be tricky due to transaction isolation,
    # we'll try to assume the create_review will just work. 
    # But to be robust, let's try to update it via the update_book endpoint if it allows?
    # No, update_book schema likely doesn't include internal fields.
    # Let's use the db_session fixture.
    
    from sqlalchemy import text
    # We need to commit because the client runs in a separate request/transaction context usually,
    # but here they might share if configured right. 
    # With the current conftest, they likely share the same engine/connection pool but different sessions.
    # Let's try raw SQL execution to force it.
    await db_session.execute(
        text(f"UPDATE books SET ai_review_summary = 'Old Summary' WHERE id = {book_id}")
    )
    await db_session.commit()

    # Verify it was set (optional, but good for sanity)
    # response = await client.get(f"{api_v1}/books/{book_id}")
    # This endpoint doesn't return ai_review_summary field by default in Book schema?
    # Let's check Book schema. backend/app/schemas/book.py
    
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

    # 10. Check AI Summary invalidation
    # We expected the summary to be cleared (None) after reviews were added/deleted.
    # Since we can't easily check the DB state for 'None' via API if the API generates it on fly,
    # we can check if the API returns a NEW summary or attempts to generate one.
    # But a better check is inspecting the DB directly.
    
    result = await db_session.execute(text(f"SELECT ai_review_summary FROM books WHERE id = {book_id}"))
    summary = result.scalar()
    assert summary is None, "AI Summary should be invalidated (None) after review operations"