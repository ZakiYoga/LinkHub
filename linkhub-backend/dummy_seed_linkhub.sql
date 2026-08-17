-- =====================================================================
-- Dummy seed data LinkHub: struktur folder departemen/divisi perusahaan
-- + beberapa link utama di root. URL sengaja di-random, bukan URL asli.
-- Asumsi: baris admin sudah ada di tabel users (dari cmd/seed).
-- Jalankan setelah migrasi 000001-000005 selesai.
-- =====================================================================

BEGIN;

DO $$
DECLARE
    admin_id uuid;
    dept_humanresources uuid := gen_random_uuid();
    div_rekrutmenonboarding uuid := gen_random_uuid();
    div_payrollbenefit uuid := gen_random_uuid();
    div_pelatihanpengembangan uuid := gen_random_uuid();
    dept_keuanganakuntansi uuid := gen_random_uuid();
    div_anggaranbudgeting uuid := gen_random_uuid();
    div_pajakkepatuhan uuid := gen_random_uuid();
    div_hutangpiutang uuid := gen_random_uuid();
    dept_teknologiinformasi uuid := gen_random_uuid();
    div_infrastrukturjaringan uuid := gen_random_uuid();
    div_pengembangansoftware uuid := gen_random_uuid();
    div_itsupporthelpdesk uuid := gen_random_uuid();
    dept_marketing uuid := gen_random_uuid();
    div_digitalmarketing uuid := gen_random_uuid();
    div_brandkreatif uuid := gen_random_uuid();
    div_risetpasar uuid := gen_random_uuid();
    dept_operasional uuid := gen_random_uuid();
    div_logistikdistribusi uuid := gen_random_uuid();
    div_procurement uuid := gen_random_uuid();
    div_qualitycontrol uuid := gen_random_uuid();
    dept_legalcompliance uuid := gen_random_uuid();
    div_kontrakperjanjian uuid := gen_random_uuid();
    div_tatakelolaperusahaan uuid := gen_random_uuid();
BEGIN
    SELECT id INTO admin_id FROM users LIMIT 1;

    -- Folder departemen (level 1, root folder)
    INSERT INTO folders (id, name, parent_id, created_by, created_at, updated_at) VALUES (dept_humanresources, 'Human Resources', NULL, admin_id, now(), now());
    INSERT INTO folders (id, name, parent_id, created_by, created_at, updated_at) VALUES (dept_keuanganakuntansi, 'Keuangan & Akuntansi', NULL, admin_id, now(), now());
    INSERT INTO folders (id, name, parent_id, created_by, created_at, updated_at) VALUES (dept_teknologiinformasi, 'Teknologi Informasi', NULL, admin_id, now(), now());
    INSERT INTO folders (id, name, parent_id, created_by, created_at, updated_at) VALUES (dept_marketing, 'Marketing', NULL, admin_id, now(), now());
    INSERT INTO folders (id, name, parent_id, created_by, created_at, updated_at) VALUES (dept_operasional, 'Operasional', NULL, admin_id, now(), now());
    INSERT INTO folders (id, name, parent_id, created_by, created_at, updated_at) VALUES (dept_legalcompliance, 'Legal & Compliance', NULL, admin_id, now(), now());

    -- Folder divisi (level 2, di bawah tiap departemen)
    INSERT INTO folders (id, name, parent_id, created_by, created_at, updated_at) VALUES (div_rekrutmenonboarding, 'Rekrutmen & Onboarding', dept_humanresources, admin_id, now(), now());
    INSERT INTO folders (id, name, parent_id, created_by, created_at, updated_at) VALUES (div_payrollbenefit, 'Payroll & Benefit', dept_humanresources, admin_id, now(), now());
    INSERT INTO folders (id, name, parent_id, created_by, created_at, updated_at) VALUES (div_pelatihanpengembangan, 'Pelatihan & Pengembangan', dept_humanresources, admin_id, now(), now());
    INSERT INTO folders (id, name, parent_id, created_by, created_at, updated_at) VALUES (div_anggaranbudgeting, 'Anggaran (Budgeting)', dept_keuanganakuntansi, admin_id, now(), now());
    INSERT INTO folders (id, name, parent_id, created_by, created_at, updated_at) VALUES (div_pajakkepatuhan, 'Pajak & Kepatuhan', dept_keuanganakuntansi, admin_id, now(), now());
    INSERT INTO folders (id, name, parent_id, created_by, created_at, updated_at) VALUES (div_hutangpiutang, 'Hutang & Piutang', dept_keuanganakuntansi, admin_id, now(), now());
    INSERT INTO folders (id, name, parent_id, created_by, created_at, updated_at) VALUES (div_infrastrukturjaringan, 'Infrastruktur & Jaringan', dept_teknologiinformasi, admin_id, now(), now());
    INSERT INTO folders (id, name, parent_id, created_by, created_at, updated_at) VALUES (div_pengembangansoftware, 'Pengembangan Software', dept_teknologiinformasi, admin_id, now(), now());
    INSERT INTO folders (id, name, parent_id, created_by, created_at, updated_at) VALUES (div_itsupporthelpdesk, 'IT Support & Helpdesk', dept_teknologiinformasi, admin_id, now(), now());
    INSERT INTO folders (id, name, parent_id, created_by, created_at, updated_at) VALUES (div_digitalmarketing, 'Digital Marketing', dept_marketing, admin_id, now(), now());
    INSERT INTO folders (id, name, parent_id, created_by, created_at, updated_at) VALUES (div_brandkreatif, 'Brand & Kreatif', dept_marketing, admin_id, now(), now());
    INSERT INTO folders (id, name, parent_id, created_by, created_at, updated_at) VALUES (div_risetpasar, 'Riset Pasar', dept_marketing, admin_id, now(), now());
    INSERT INTO folders (id, name, parent_id, created_by, created_at, updated_at) VALUES (div_logistikdistribusi, 'Logistik & Distribusi', dept_operasional, admin_id, now(), now());
    INSERT INTO folders (id, name, parent_id, created_by, created_at, updated_at) VALUES (div_procurement, 'Procurement', dept_operasional, admin_id, now(), now());
    INSERT INTO folders (id, name, parent_id, created_by, created_at, updated_at) VALUES (div_qualitycontrol, 'Quality Control', dept_operasional, admin_id, now(), now());
    INSERT INTO folders (id, name, parent_id, created_by, created_at, updated_at) VALUES (div_kontrakperjanjian, 'Kontrak & Perjanjian', dept_legalcompliance, admin_id, now(), now());
    INSERT INTO folders (id, name, parent_id, created_by, created_at, updated_at) VALUES (div_tatakelolaperusahaan, 'Tata Kelola Perusahaan', dept_legalcompliance, admin_id, now(), now());

    -- Item di root (folder_id NULL) -- link utama perusahaan
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('5881c5ac-1c98-471d-97ac-3d04a126224f', 'Portal Utama Perusahaan', 'https://drive.google.com/drive/folders/odJFCrnl2edlBDdz1C5Jau2RJtBRnlWmT', 'drive', NULL, 'Landing utama seluruh dokumen dan sistem internal', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('2d0612cb-a41b-407c-8b85-d428d97af365', 'Kalender Cuti & Hari Libur Nasional', 'https://docs.google.com/spreadsheets/d/Hf6pWkLUyifDLkDmWJ6UuVTAIjvF/edit', 'spreadsheet', NULL, 'Kalender cuti bersama dan libur nasional tahun berjalan', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('e436b903-bc69-474a-8352-1e437f94b934', 'Handbook Karyawan', 'https://docs.google.com/document/d/7WICPhDeOZIiBOB-Y6sHrFH2/edit', 'document', NULL, 'Panduan umum kebijakan dan budaya perusahaan', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('386bfca7-a73c-4e95-9428-dfe07490ffbf', 'Formulir Pengajuan IT Helpdesk', 'https://docs.google.com/forms/d/ZUCr-lgotu2iXW7GboIRoL3u6aHwnMztV/viewform', 'form', NULL, 'Form umum pelaporan kendala IT lintas departemen', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('8c127a4a-7742-4259-9886-a4eb257481ed', 'Company Overview Deck', 'https://docs.google.com/presentation/d/aP_coUNEhEkk_iqq8vH2BzNZ/edit', 'slides', NULL, 'Materi presentasi profil perusahaan untuk pihak eksternal', admin_id, now(), now());

    -- Item di tiap folder divisi
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('1d4da24a-7cbe-4f7b-a4af-f974b2be7ddb', 'Tracker Kandidat Aktif', 'https://docs.google.com/spreadsheets/d/V45pFCiRcDCajhDieQjEJ_Bq8F80ymm3T/edit', 'spreadsheet', div_rekrutmenonboarding, 'Rekap status kandidat dari screening sampai offering', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('1a4fa226-2dfa-4bc0-9b92-5e125057863a', 'Checklist Onboarding Karyawan Baru', 'https://docs.google.com/document/d/07gmhZRnFyy5r2xJ7Fj4mgblEv0_/edit', 'document', div_rekrutmenonboarding, 'Daftar tugas HR & user selama minggu pertama', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('4938a913-4a1e-49df-9f85-bad9bba62c25', 'Form Permintaan Rekrutmen Posisi Baru', 'https://docs.google.com/forms/d/BZhvWaXH6K2_tyLBhhOhg9uhkxii/viewform', 'form', div_rekrutmenonboarding, 'Diisi manager sebelum posisi dibuka ke publik', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('ec03fdd8-3a95-4a09-935a-bb43f55790e9', 'Slide Deck Employer Branding', 'https://docs.google.com/presentation/d/EZpFfk1OHAOEHYqM6Ojb6mjBHqSiFVKu4/edit', 'slides', div_rekrutmenonboarding, 'Materi presentasi untuk job fair & kampus', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('1a9395a2-a781-42e7-b5c8-b31c921284e3', 'Rekap Payroll Bulanan', 'https://docs.google.com/spreadsheets/d/MbMnrHontIKARAH_Ggl2JfaQqHu42bojt/edit', 'spreadsheet', div_payrollbenefit, 'Rekap gaji, potongan, dan lembur seluruh karyawan', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('5047418c-00d8-4d29-91e3-9c2f55cbdb5e', 'Kebijakan Benefit & Asuransi', 'https://docs.google.com/document/d/eVs3qfNUfTAFnT0tEuw0dwQ0FIunWe8Cz/edit', 'document', div_payrollbenefit, 'Dokumen resmi cakupan BPJS dan asuransi tambahan', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('ab1afe7b-0c10-4c18-b030-d9b3d1fb72d1', 'Form Klaim Reimbursement', 'https://docs.google.com/forms/d/SNDCdyZQJiJSZQdoHwHen3SO3oXy/viewform', 'form', div_payrollbenefit, 'Pengajuan klaim kesehatan dan perjalanan dinas', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('cd6981ce-bb37-498e-b02e-9f8cbcc5a826', 'Kalender Training Tahunan', 'https://docs.google.com/spreadsheets/d/f3azU3iQOpMN0PZLqy1WwMZaMKA3/edit', 'spreadsheet', div_pelatihanpengembangan, 'Jadwal training internal dan eksternal per kuartal', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('4f7baed6-12df-458d-bc79-23a56b74fd34', 'Materi Leadership Program', 'https://docs.google.com/presentation/d/P744B8vkKQlENCzsdfF8j61yX-ZFsan2C/edit', 'slides', div_pelatihanpengembangan, 'Deck untuk program pengembangan calon manager', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('ef04366b-1a31-4e60-9e4c-b90b4ef15ec1', 'Folder Sertifikat Karyawan', 'https://drive.google.com/drive/folders/7gFp6r7O425u85HFJ_EJ4jKE', 'drive', div_pelatihanpengembangan, 'Kumpulan scan sertifikat pelatihan karyawan', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('727d7d65-a335-41cf-9989-9b5223c2b058', 'Budget Planning FY2026', 'https://docs.google.com/spreadsheets/d/QOkrtDXtBi10Q71hA1XcW9aTMX1C/edit', 'spreadsheet', div_anggaranbudgeting, 'Rencana anggaran tahunan per departemen', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('32974ddb-def0-41de-9236-c16499ba6341', 'Template Pengajuan Anggaran', 'https://docs.google.com/document/d/CI3_dXRZv7qdYdk2r7xgHWPB6PRW/edit', 'document', div_anggaranbudgeting, 'Format standar pengajuan budget tambahan', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('7c7c9887-59b0-40a4-ad3d-e34df1245d9d', 'Dashboard Realisasi Anggaran', 'https://intranet.internal.co.id/link/1Gk8cgSCifdFzctEq8oB7GVvouNn', 'other', div_anggaranbudgeting, 'Dashboard BI internal realisasi vs rencana', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('28bdc252-9c38-4fed-bb44-277590320429', 'Rekap Laporan Pajak Bulanan', 'https://docs.google.com/spreadsheets/d/dNWYzjFnMpfS2ViRb1_n3U6t3wI973IPF/edit', 'spreadsheet', div_pajakkepatuhan, 'Rekap PPh 21, PPN, dan laporan pajak lainnya', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('2949d0b7-2bec-477c-9aa2-2dd5f121a31e', 'Panduan Kepatuhan Pajak Internal', 'https://docs.google.com/document/d/J5F7WRd-Px_BTHRJJbykE0_E/edit', 'document', div_pajakkepatuhan, 'SOP internal pelaporan dan pembayaran pajak', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('b2b3ddaf-bfa0-4923-9027-240b05ff5ac2', 'Tracker Invoice Vendor', 'https://docs.google.com/spreadsheets/d/8_5clLCZFNV8S2QT6INGDpyOpxyB9JKmy/edit', 'spreadsheet', div_hutangpiutang, 'Status pembayaran invoice ke seluruh vendor', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('0fc0b67e-d699-41c6-bcbe-ec7f9cbac9b6', 'Tracker Piutang Klien', 'https://docs.google.com/spreadsheets/d/DUwMbqJfgLq_nbK894RxgG9oiZ_j/edit', 'spreadsheet', div_hutangpiutang, 'Status penagihan dan jatuh tempo piutang klien', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('58c5e8af-6bdf-4f63-bf93-6f973ba12ea5', 'Form Pengajuan Pembayaran', 'https://docs.google.com/forms/d/gttMkFp1CW54M2NhmABHkuEwjua058LeD/viewform', 'form', div_hutangpiutang, 'Form pengajuan pembayaran ke vendor/rekanan', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('d93104f3-9087-4ef1-85b9-2cd5c2f8ad7e', 'Diagram Topologi Jaringan Kantor', 'https://docs.google.com/document/d/K6jDHz2oCtIsjhvNK4p7MZI-4kf3/edit', 'document', div_infrastrukturjaringan, 'Dokumentasi arsitektur jaringan seluruh kantor', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('c9eb8342-81d1-4979-aeed-08e5576842a9', 'Inventaris Perangkat Server', 'https://docs.google.com/spreadsheets/d/PGdlDcIfw84Jx3_l8S0QPnuQ0-KZe6lOG/edit', 'spreadsheet', div_infrastrukturjaringan, 'Daftar aset server dan status maintenance', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('655e41e4-2551-4392-b13e-a411cfbeca1a', 'Runbook Incident Response', 'https://docs.google.com/document/d/oZa70gyU-4gAIqK4_pdEuNb0lCo7/edit', 'document', div_infrastrukturjaringan, 'Prosedur penanganan insiden infrastruktur', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('0ef70cd1-081e-4d28-9cc1-18ac5d2817a2', 'Roadmap Produk Internal', 'https://docs.google.com/presentation/d/t-LI198F6sXyriJ1RIaKM_t5/edit', 'slides', div_pengembangansoftware, 'Roadmap fitur aplikasi internal per kuartal', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('eb1aa520-ede7-4c9c-94cd-b50230a31f9c', 'Dokumentasi API Internal', 'https://docs.google.com/document/d/9SQW6PyEXD0fO8WXt-eqQm4m6bs0tj8HR/edit', 'document', div_pengembangansoftware, 'Referensi endpoint API layanan internal', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('f0ccacd8-0539-4104-b654-828d147c354c', 'Board Sprint Planning', 'https://intranet.internal.co.id/link/YkQWO_eiEKDl3mm4vMdfPhLTV3sF0xvwk', 'other', div_pengembangansoftware, 'Board Kanban untuk perencanaan sprint tim dev', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('00831283-d090-40f0-8e07-998b718351a2', 'Form Pengajuan Tiket IT', 'https://docs.google.com/forms/d/WE-sD7G6Gb7Kuj4SM2G6MzX9nEWTLLcYJ/viewform', 'form', div_itsupporthelpdesk, 'Form pelaporan kendala perangkat/akun', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('11432769-1fa3-4bd4-9f68-9710d3c92f3e', 'Panduan Troubleshooting Umum', 'https://docs.google.com/document/d/g-KDTCyGrmfN4eUqlLP1wzqU/edit', 'document', div_itsupporthelpdesk, 'FAQ dan solusi masalah IT yang sering terjadi', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('2d8b9363-a64c-4317-889f-751f13ee41bc', 'Rekap Aset Laptop Karyawan', 'https://docs.google.com/spreadsheets/d/IvG9LRo7jsCYUlYbHp6VHWVnD8dPCi7M0/edit', 'spreadsheet', div_itsupporthelpdesk, 'Daftar peminjaman laptop dan status garansi', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('5c181db2-3040-47db-89d7-fd32db899cd9', 'Kalender Konten Media Sosial', 'https://docs.google.com/spreadsheets/d/rfeM-omErX6V1t1m_0JeVB44/edit', 'spreadsheet', div_digitalmarketing, 'Jadwal posting seluruh kanal sosial media', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('e20db5c8-786f-42a8-8bb0-3be88840239e', 'Laporan Performa Campaign Ads', 'https://docs.google.com/spreadsheets/d/UmVThYJyp6lBcgQFqAiABDQs/edit', 'spreadsheet', div_digitalmarketing, 'Rekap performa iklan digital bulanan', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('4563dda9-4c04-4434-a1c8-4077749c12e7', 'Deck Strategi Digital Marketing', 'https://docs.google.com/presentation/d/aJsqGwodqbTEPcwHgq1oi85Un5CfM6dh9/edit', 'slides', div_digitalmarketing, 'Strategi kampanye digital tahun berjalan', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('0cb20604-e47a-4383-b39e-6af89b96e5df', 'Brand Guideline Perusahaan', 'https://docs.google.com/document/d/2n_4jkPsiqJPWL63moB35D0R6Z1m/edit', 'document', div_brandkreatif, 'Panduan penggunaan logo, warna, dan tipografi', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('89f0fe07-4895-445c-b6cc-efc7ca5e8b37', 'Folder Aset Desain', 'https://drive.google.com/drive/folders/2OGVt8ilkl3mVqhQp0T2gKNTnBt9', 'drive', div_brandkreatif, 'Kumpulan asset visual, banner, dan template desain', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('4bda0ae0-26ed-4f39-939c-c1e5b1026310', 'Deck Konsep Campaign Kuartalan', 'https://docs.google.com/presentation/d/nSVoJC2dIdxINRSaxsZisdlB/edit', 'slides', div_brandkreatif, 'Konsep kreatif kampanye per kuartal', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('b163595a-beb9-4a20-81f4-cbce37c5fa0c', 'Laporan Riset Kompetitor', 'https://docs.google.com/document/d/16RuVNPkgtugkI42_41IBoS3oK_N/edit', 'document', div_risetpasar, 'Analisis posisi kompetitor di pasar', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('b552f63b-263d-4177-9085-10a5daca43a8', 'Survey Kepuasan Pelanggan', 'https://docs.google.com/forms/d/CYhaAMBrGLPpa-3wqWDTjYf3/viewform', 'form', div_risetpasar, 'Form survey NPS dan kepuasan pelanggan', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('28403943-9936-4eec-9244-b0701488acc4', 'Rekap Data Survey Pasar', 'https://docs.google.com/spreadsheets/d/6jO2Z1LoZcPv6Ul3nF3ZkYNR/edit', 'spreadsheet', div_risetpasar, 'Kompilasi hasil survey riset pasar', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('d3cf4e55-d439-46f2-9973-ed44db54725b', 'Tracker Pengiriman Barang', 'https://docs.google.com/spreadsheets/d/QvjoySSsEnsGzwtjw-75POt4/edit', 'spreadsheet', div_logistikdistribusi, 'Status pengiriman dan estimasi tiba di gudang', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('7ea51ef8-e7e5-4556-a7cd-ed8f673105b6', 'SOP Distribusi Regional', 'https://docs.google.com/document/d/84MJhTjN75ehVKjlX7f5yP8t/edit', 'document', div_logistikdistribusi, 'Prosedur distribusi barang ke tiap regional', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('a0faf76b-818c-4f57-9875-9c9c1b80e42c', 'Daftar Vendor Terdaftar', 'https://docs.google.com/spreadsheets/d/5nRkwfF44uUVKX0RgQiQmXKG/edit', 'spreadsheet', div_procurement, 'Rekap vendor aktif beserta kontrak berjalan', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('e6f07cd4-33be-4353-906f-e49b379115c8', 'Form Pengajuan Pembelian (PO)', 'https://docs.google.com/forms/d/tQksSNYqkNWQql2UcUNxBR_yCrtjLmeRq/viewform', 'form', div_procurement, 'Form pengajuan purchase order barang/jasa', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('ee725c7c-1d7f-4168-a2f3-4fb0ddf8b4ec', 'Template Perbandingan Penawaran', 'https://docs.google.com/document/d/Wtuxv4f0UE4K5DEN8yV47KW1uzrGg9Vnp/edit', 'document', div_procurement, 'Format perbandingan quotation antar vendor', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('552fecfa-0425-4993-a36b-5191b85cae88', 'Checklist QC Produk', 'https://docs.google.com/document/d/kuI5s3lC5Sd1gYVEXkVCdOmQsreK/edit', 'document', div_qualitycontrol, 'Standar pemeriksaan kualitas sebelum distribusi', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('afcc1c8d-f22f-4a80-99fb-200f0e0ebb5a', 'Rekap Temuan Ketidaksesuaian', 'https://docs.google.com/spreadsheets/d/r85akcGBt2oKEMpgE16io-cEsL2a/edit', 'spreadsheet', div_qualitycontrol, 'Log temuan QC dan tindak lanjut perbaikan', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('5cdf31a9-979f-413d-9d20-fe0b2fb0339e', 'Rekap Kontrak Aktif', 'https://docs.google.com/spreadsheets/d/TE1xkUicX8fXVGcTiSEnQrfTRw79xri6e/edit', 'spreadsheet', div_kontrakperjanjian, 'Daftar kontrak berjalan beserta tanggal berakhir', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('8649bb5a-cc15-4a24-b597-9871caeb878a', 'Template Perjanjian Kerja Sama', 'https://docs.google.com/document/d/zfzfONY8GeyKTgQIpV3Z4XRx--VI/edit', 'document', div_kontrakperjanjian, 'Template standar MoU dan perjanjian vendor', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('db53d780-f335-49ea-ad47-6910a93f8b55', 'Folder Arsip Kontrak', 'https://drive.google.com/drive/folders/2k3xLPnkPLN52v4S5fT3JhjZ', 'drive', div_kontrakperjanjian, 'Arsip digital seluruh dokumen kontrak', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('4d7ad2f4-e961-46b1-92bb-6280ca462908', 'Notulen Rapat Direksi', 'https://docs.google.com/document/d/uds4eqiEUUXet5VV4jrUYOJFodx-/edit', 'document', div_tatakelolaperusahaan, 'Kumpulan notulen rapat direksi bulanan', admin_id, now(), now());
    INSERT INTO menu_items (id, name, url, type, folder_id, description, created_by, created_at, updated_at) VALUES ('9b59314e-8c41-455b-8f09-22a360f6f0f1', 'Kebijakan Kode Etik Perusahaan', 'https://docs.google.com/document/d/XpHH5BK_zprj5w4lOSiLMuwUCpzrE-dUV/edit', 'document', div_tatakelolaperusahaan, 'Dokumen resmi kode etik dan tata kelola', admin_id, now(), now());

END $$;

-- Tags
INSERT INTO tags (id, name) VALUES ('4e3bda99-7222-4034-b2e9-cc58888df258', 'penting');
INSERT INTO tags (id, name) VALUES ('ba06eb2a-b116-4df6-b846-f7692a2b0ef3', 'template');
INSERT INTO tags (id, name) VALUES ('d9f0d4a0-712e-4d36-ab57-8909a1febb11', 'SOP');
INSERT INTO tags (id, name) VALUES ('0066f715-fe70-4855-aff3-b6b94b48113a', '2026');
INSERT INTO tags (id, name) VALUES ('c7b71ec6-866c-4de0-b2db-98e3ffa0909e', 'onboarding');
INSERT INTO tags (id, name) VALUES ('902d942d-5d0c-4e95-8175-ae1bcd8695be', 'budget');
INSERT INTO tags (id, name) VALUES ('1df31d8f-f66a-40a9-b96b-10459f992854', 'confidential');
INSERT INTO tags (id, name) VALUES ('e37e53ab-f1ca-45dd-a0a8-4e8ba42d188d', 'arsip');
INSERT INTO tags (id, name) VALUES ('20840cd3-6536-48ea-8874-03409f187f8d', 'draft');
INSERT INTO tags (id, name) VALUES ('88a7e85e-feef-4413-a74e-1a0214245135', 'panduan');

-- Assign tag ke sebagian item (many-to-many) secara acak
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('1d4da24a-7cbe-4f7b-a4af-f974b2be7ddb', '20840cd3-6536-48ea-8874-03409f187f8d');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('1d4da24a-7cbe-4f7b-a4af-f974b2be7ddb', 'd9f0d4a0-712e-4d36-ab57-8909a1febb11');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('ec03fdd8-3a95-4a09-935a-bb43f55790e9', '1df31d8f-f66a-40a9-b96b-10459f992854');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('1a9395a2-a781-42e7-b5c8-b31c921284e3', '20840cd3-6536-48ea-8874-03409f187f8d');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('1a9395a2-a781-42e7-b5c8-b31c921284e3', '1df31d8f-f66a-40a9-b96b-10459f992854');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('5047418c-00d8-4d29-91e3-9c2f55cbdb5e', '88a7e85e-feef-4413-a74e-1a0214245135');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('5047418c-00d8-4d29-91e3-9c2f55cbdb5e', 'ba06eb2a-b116-4df6-b846-f7692a2b0ef3');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('ab1afe7b-0c10-4c18-b030-d9b3d1fb72d1', '902d942d-5d0c-4e95-8175-ae1bcd8695be');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('4f7baed6-12df-458d-bc79-23a56b74fd34', 'e37e53ab-f1ca-45dd-a0a8-4e8ba42d188d');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('4f7baed6-12df-458d-bc79-23a56b74fd34', '20840cd3-6536-48ea-8874-03409f187f8d');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('ef04366b-1a31-4e60-9e4c-b90b4ef15ec1', 'd9f0d4a0-712e-4d36-ab57-8909a1febb11');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('727d7d65-a335-41cf-9989-9b5223c2b058', 'd9f0d4a0-712e-4d36-ab57-8909a1febb11');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('32974ddb-def0-41de-9236-c16499ba6341', '20840cd3-6536-48ea-8874-03409f187f8d');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('32974ddb-def0-41de-9236-c16499ba6341', '4e3bda99-7222-4034-b2e9-cc58888df258');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('28bdc252-9c38-4fed-bb44-277590320429', 'c7b71ec6-866c-4de0-b2db-98e3ffa0909e');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('2949d0b7-2bec-477c-9aa2-2dd5f121a31e', 'd9f0d4a0-712e-4d36-ab57-8909a1febb11');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('b2b3ddaf-bfa0-4923-9027-240b05ff5ac2', '0066f715-fe70-4855-aff3-b6b94b48113a');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('0fc0b67e-d699-41c6-bcbe-ec7f9cbac9b6', '20840cd3-6536-48ea-8874-03409f187f8d');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('58c5e8af-6bdf-4f63-bf93-6f973ba12ea5', 'ba06eb2a-b116-4df6-b846-f7692a2b0ef3');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('d93104f3-9087-4ef1-85b9-2cd5c2f8ad7e', '0066f715-fe70-4855-aff3-b6b94b48113a');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('c9eb8342-81d1-4979-aeed-08e5576842a9', 'd9f0d4a0-712e-4d36-ab57-8909a1febb11');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('655e41e4-2551-4392-b13e-a411cfbeca1a', '88a7e85e-feef-4413-a74e-1a0214245135');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('eb1aa520-ede7-4c9c-94cd-b50230a31f9c', '88a7e85e-feef-4413-a74e-1a0214245135');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('f0ccacd8-0539-4104-b654-828d147c354c', 'd9f0d4a0-712e-4d36-ab57-8909a1febb11');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('00831283-d090-40f0-8e07-998b718351a2', '88a7e85e-feef-4413-a74e-1a0214245135');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('4563dda9-4c04-4434-a1c8-4077749c12e7', '0066f715-fe70-4855-aff3-b6b94b48113a');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('0cb20604-e47a-4383-b39e-6af89b96e5df', '88a7e85e-feef-4413-a74e-1a0214245135');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('0cb20604-e47a-4383-b39e-6af89b96e5df', '4e3bda99-7222-4034-b2e9-cc58888df258');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('89f0fe07-4895-445c-b6cc-efc7ca5e8b37', '20840cd3-6536-48ea-8874-03409f187f8d');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('89f0fe07-4895-445c-b6cc-efc7ca5e8b37', 'c7b71ec6-866c-4de0-b2db-98e3ffa0909e');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('4bda0ae0-26ed-4f39-939c-c1e5b1026310', 'e37e53ab-f1ca-45dd-a0a8-4e8ba42d188d');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('b163595a-beb9-4a20-81f4-cbce37c5fa0c', '1df31d8f-f66a-40a9-b96b-10459f992854');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('b552f63b-263d-4177-9085-10a5daca43a8', 'e37e53ab-f1ca-45dd-a0a8-4e8ba42d188d');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('7ea51ef8-e7e5-4556-a7cd-ed8f673105b6', 'e37e53ab-f1ca-45dd-a0a8-4e8ba42d188d');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('a0faf76b-818c-4f57-9875-9c9c1b80e42c', 'e37e53ab-f1ca-45dd-a0a8-4e8ba42d188d');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('a0faf76b-818c-4f57-9875-9c9c1b80e42c', '88a7e85e-feef-4413-a74e-1a0214245135');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('e6f07cd4-33be-4353-906f-e49b379115c8', '902d942d-5d0c-4e95-8175-ae1bcd8695be');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('ee725c7c-1d7f-4168-a2f3-4fb0ddf8b4ec', '902d942d-5d0c-4e95-8175-ae1bcd8695be');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('552fecfa-0425-4993-a36b-5191b85cae88', '902d942d-5d0c-4e95-8175-ae1bcd8695be');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('afcc1c8d-f22f-4a80-99fb-200f0e0ebb5a', 'd9f0d4a0-712e-4d36-ab57-8909a1febb11');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('afcc1c8d-f22f-4a80-99fb-200f0e0ebb5a', '902d942d-5d0c-4e95-8175-ae1bcd8695be');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('8649bb5a-cc15-4a24-b597-9871caeb878a', '0066f715-fe70-4855-aff3-b6b94b48113a');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('db53d780-f335-49ea-ad47-6910a93f8b55', 'ba06eb2a-b116-4df6-b846-f7692a2b0ef3');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('db53d780-f335-49ea-ad47-6910a93f8b55', 'c7b71ec6-866c-4de0-b2db-98e3ffa0909e');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('4d7ad2f4-e961-46b1-92bb-6280ca462908', '0066f715-fe70-4855-aff3-b6b94b48113a');
INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ('4d7ad2f4-e961-46b1-92bb-6280ca462908', 'd9f0d4a0-712e-4d36-ab57-8909a1febb11');

COMMIT;