import re

with open('frontend/src/app/accounting/cash-flow/page.tsx', 'r') as f:
    content = f.read()

# 1. Add imports
content = content.replace(
    'ticketOptionsService,\n} from "@/lib/supabaseService";',
    'ticketOptionsService,\n  hotelsService,\n  suppliersService,\n  agenciesService,\n} from "@/lib/supabaseService";'
)

# 2. Add to CashFlowItem
content = content.replace(
    'hotel?: string;',
    'hotel?: string;\n  hotel_id?: string;\n  supplier_id?: string;\n  agency_id?: string;'
)

# 3. Add to Collection mapping (agency_id, hotel_id)
content = content.replace(
    'agency_name: project?.agencies?.name || "",',
    'agency_name: project?.agencies?.name || "",\n            agency_id: project?.agency_id || "",'
)

# 4. Add to Payment mapping (hotel_id, supplier_id)
payment_map_target = r'payment_type: plan\.payment_type \|\| "",\n\s*hotel: hotelValue,'
payment_map_replacement = r'payment_type: plan.payment_type || "",\n            hotel: hotelValue,\n            hotel_id: plan.hotel_id || project?.hotel_id || "",\n            supplier_id: plan.supplier_id || "",'
content = re.sub(payment_map_target, payment_map_replacement, content)

with open('frontend/src/app/accounting/cash-flow/page.tsx', 'w') as f:
    f.write(content)
