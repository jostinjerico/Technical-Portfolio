from auth_module import generate_otp, verify_otp

def test_otp():
    secret = "JBSWY3DPEHPK3PXP"
    otp = generate_otp(secret)
    assert verify_otp(secret, otp) == True