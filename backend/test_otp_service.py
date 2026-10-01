import asyncio

from app.db.mongo import client
from app.services.otp_service import create_otp, verify_otp


async def test_otp():
    email = "testotp@mealbridge.com"

    otp = await create_otp(
        email=email,
        purpose="REGISTER"
    )

    print("OTP service is working.")
    print("Generated OTP for local testing:", otp)

    wrong_result = await verify_otp(
        email=email,
        otp="000000",
        purpose="REGISTER"
    )

    print("Wrong OTP accepted:", wrong_result)

    correct_result = await verify_otp(
        email=email,
        otp=otp,
        purpose="REGISTER"
    )

    print("Correct OTP accepted:", correct_result)

    await client.close()


asyncio.run(test_otp())