with open("frontend/src/lib/supabaseService.ts", "r") as f:
    text = f.read()

# For rooms read
text = text.replace(
    "checkIn: room.check_in || room.checkIn || \"\",",
    "checkIn: room.check_in_date || room.check_in || room.checkIn || \"\","
)
text = text.replace(
    "checkOut: room.check_out || room.checkOut || \"\",",
    "checkOut: room.check_out_date || room.check_out || room.checkOut || \"\","
)

# For extra services read
text = text.replace(
    "serviceName: service.service_name || service.serviceName || service.service_types?.name || service.serviceTypeName || \"\",",
    "date: service.date || \"\",\n        serviceName: service.service_name || service.serviceName || service.service_types?.name || service.serviceTypeName || \"\","
)

with open("frontend/src/lib/supabaseService.ts", "w") as f:
    f.write(text)

