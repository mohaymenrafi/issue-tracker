import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.issues import router as issues_router
from app.middleware.timer import timer_middleware


app = FastAPI()
app.middleware("http")(timer_middleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(issues_router)

if __name__ == "__main__":
    uvicorn.run("main:app", reload=True)
