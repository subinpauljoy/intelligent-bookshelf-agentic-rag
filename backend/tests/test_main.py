import pytest

@pytest.mark.asyncio
async def test_read_main(client):
    response = await client.get("/api/v1/books/")
    assert response.status_code == 200
    assert response.json() == []
