import os

# 1. Update DoctorLayout.tsx
layout_path = 'frontend/src/components/layout/DoctorLayout.tsx'
with open(layout_path, 'r', encoding='utf-8') as f:
    layout_content = f.read()

target1 = '{ label: "Parkinson\'s Analysis", icon: Activity, path: "/doctor/analysis/parkinson" },'
replacement1 = '{ label: "Parkinson\'s Analysis", icon: Activity, path: "/doctor/analysis/parkinson" },\n    { label: "AI Testing Dashboard", icon: Sparkles, path: "/doctor/testing" },'

if target1 in layout_content:
    layout_content = layout_content.replace(target1, replacement1)

breadcrumb_target = 'if (currentPath === "/doctor/analysis/parkinson") return "Parkinson\'s Movement Analysis";'
breadcrumb_rep = 'if (currentPath === "/doctor/analysis/parkinson") return "Parkinson\'s Movement Analysis";\n    if (currentPath === "/doctor/testing") return "AI Testing and Evaluation Dashboard";'

if breadcrumb_target in layout_content:
    layout_content = layout_content.replace(breadcrumb_target, breadcrumb_rep)

with open(layout_path, 'w', encoding='utf-8') as f:
    f.write(layout_content)
print("Updated DoctorLayout.tsx successfully!")

# 2. Update routes/index.tsx
routes_path = 'frontend/src/routes/index.tsx'
with open(routes_path, 'r', encoding='utf-8') as f:
    routes_content = f.read()

import_target = 'import { DoctorNotificationsPage } from "@/pages/doctor/DoctorNotificationsPage";'
import_rep = 'import { DoctorNotificationsPage } from "@/pages/doctor/DoctorNotificationsPage";\nimport { TestingDashboardPage } from "@/pages/TestingDashboardPage";'

if import_target in routes_content and 'TestingDashboardPage' not in routes_content:
    routes_content = routes_content.replace(import_target, import_rep)

switch_target = 'case "/doctor/analysis/parkinson":\n          return (\n            <ParkinsonAnalysisPage\n              onBack={() => navigateTo("/doctor/analysis")}\n              onNavigateToReports={() => navigateTo("/doctor/reports")}\n            />\n          );'
switch_rep = switch_target + '\n        case "/doctor/testing":\n          return <TestingDashboardPage />;'

if switch_target in routes_content and 'case "/doctor/testing":' not in routes_content:
    routes_content = routes_content.replace(switch_target, switch_rep)

with open(routes_path, 'w', encoding='utf-8') as f:
    f.write(routes_content)
print("Updated routes/index.tsx successfully!")

