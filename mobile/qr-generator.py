#!/usr/bin/env python3
import qrcode
import sys

# Get the local IP
ip = "172.24.135.249"
expo_url = f"exp://{ip}:8081"

print(f"Generating QR code for: {expo_url}")

# Create QR code
qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_L,
    box_size=2,
    border=2,
)
qr.add_data(expo_url)
qr.make(fit=True)

# Print QR code to terminal
qr.print_ascii(invert=True)

print(f"\nScan this QR code with Expo Go app")
print(f"Or manually enter: {expo_url}")
print(f"\nMake sure your phone is on the same WiFi network!")