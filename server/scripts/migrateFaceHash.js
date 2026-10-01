/**
 * Script migration: Them originalHash va cropHash vao face_data cua tat ca nhan vien
 * da dang ky khuon mat TRUOC khi co tinh nang hash checking.
 *
 * Chay 1 lan: node scripts/migrateFaceHash.js
 */
const crypto = require("crypto");
const pool = require("../config/db");

function computeHash(base64Str) {
  if (!base64Str) return "";
  const clean = base64Str.includes(",") ? base64Str.split(",")[1] : base64Str;
  return crypto.createHash("sha256").update(clean.trim()).digest("hex");
}

async function migrate() {
  console.log("[Migration] Dang cap nhat hash khuon mat cho nhan vien...");
  const [rows] = await pool.query(
    "SELECT ma_nhan_vien, ho_ten, du_lieu_khuon_mat FROM nhan_vien WHERE du_lieu_khuon_mat IS NOT NULL"
  );

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    let faceData = null;
    try {
      if (typeof row.du_lieu_khuon_mat === "string") {
        faceData = JSON.parse(row.du_lieu_khuon_mat);
      } else {
        faceData = row.du_lieu_khuon_mat;
      }
    } catch (e) {
      console.warn(`  [SKIP] ID ${row.ma_nhan_vien} (${row.ho_ten}): khong parse duoc face_data`);
      skipped++;
      continue;
    }

    if (!faceData || !faceData.image) {
      console.warn(`  [SKIP] ID ${row.ma_nhan_vien} (${row.ho_ten}): khong co image trong face_data`);
      skipped++;
      continue;
    }

    if (faceData.cropHash) {
      console.log(`  [SKIP] ID ${row.ma_nhan_vien} (${row.ho_ten}): da co hash`);
      skipped++;
      continue;
    }

    const cropHash = computeHash(faceData.image);
    faceData.cropHash = cropHash;
    faceData.originalHash = cropHash;

    await pool.query(
      "UPDATE nhan_vien SET du_lieu_khuon_mat = ? WHERE ma_nhan_vien = ?",
      [JSON.stringify(faceData), row.ma_nhan_vien]
    );

    console.log(`  [OK] ID ${row.ma_nhan_vien} (${row.ho_ten}): da them cropHash`);
    updated++;
  }

  console.log(`\n[Migration] Hoan tat: ${updated} cap nhat, ${skipped} bo qua.`);
  process.exit(0);
}

migrate().catch((err) => {
  console.error("[Migration] Loi:", err.message);
  process.exit(1);
});
