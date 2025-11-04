from fastapi import APIRouter

router = APIRouter(prefix="/api/pub", tags=["Pub"])


@router.post('/login')
async def login():
    pass

@router.post('auth')
async def auth():
    pass