import sql from "mssql";
import { getMasterPool } from "../db/masterDb";
import { getAnalyticsPool } from "../db/analyticsDb";

// --- MULTI-DASHBOARD CRUD ---

export async function getAllDashboards(userId: number) {
  const pool = await getMasterPool();
  const result = await pool.request()
    .input("UserId", sql.Int, userId)
    .query(`SELECT Id, Name, CreatedAt FROM Dashboards WHERE UserId = @UserId ORDER BY CreatedAt DESC`);
  return result.recordset;
}

export async function getDashboardById(userId: number, dashboardId: number) {
  const pool = await getMasterPool();
  const result = await pool.request()
    .input("UserId", sql.Int, userId)
    .input("Id", sql.Int, dashboardId)
    .query(`SELECT * FROM Dashboards WHERE UserId = @UserId AND Id = @Id`);
  
  const row = result.recordset[0];
  if (!row) return null;

  return {
    ...row,
    widgets: JSON.parse(row.LayoutJson || '{"widgets":[]}').widgets
  };
}

export async function createDashboard(userId: number, name: string, layout: any) {
  const pool = await getMasterPool();
  const layoutJson = JSON.stringify(layout);
  
  const result = await pool.request()
    .input("UserId", sql.Int, userId)
    .input("Name", sql.NVarChar, name)
    .input("LayoutJson", sql.NVarChar, layoutJson)
    .query(`
      INSERT INTO Dashboards (UserId, Name, LayoutJson)
      OUTPUT INSERTED.Id
      VALUES (@UserId, @Name, @LayoutJson)
    `);
  
  return result.recordset[0].Id;
}

export async function updateDashboard(userId: number, dashboardId: number, layout: any) {
  const pool = await getMasterPool();
  const layoutJson = JSON.stringify(layout);
  
  await pool.request()
    .input("UserId", sql.Int, userId)
    .input("Id", sql.Int, dashboardId)
    .input("LayoutJson", sql.NVarChar, layoutJson)
    .query(`
      UPDATE Dashboards
      SET LayoutJson = @LayoutJson, UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @Id AND UserId = @UserId
    `);
}

// --- WIDGET MANAGEMENT (Real App Implementation) ---

/**
 * Saves a generated SQL query as a reusable widget.
 * Called when the user clicks "Save to Dashboard".
 */
export async function createSavedWidget(userId: number, name: string, type: string, sqlQuery: string) {
  const pool = await getMasterPool();
  
  const result = await pool.request()
    .input("UserId", sql.Int, userId)
    .input("Name", sql.NVarChar, name)
    .input("Type", sql.NVarChar, type)
    .input("SqlQuery", sql.NVarChar, sqlQuery)
    .query(`
      INSERT INTO SavedWidgets (UserId, Name, Type, SqlQuery)
      OUTPUT INSERTED.Id
      VALUES (@UserId, @Name, @Type, @SqlQuery)
    `);

  return result.recordset[0].Id;
}

// --- WIDGET DATA EXECUTION ---

export async function getWidgetData(userId: number, widgetId: string) {
  // 1. Identify the Widget ID
  // In a real app, widgetId should be the primary key from 'SavedWidgets'
  const dbWidgetId = parseInt(widgetId, 10);

  if (isNaN(dbWidgetId)) {
    // Handle legacy hardcoded widgets if necessary, or throw error
    console.warn(`Invalid or legacy widget ID requested: ${widgetId}`);
    return []; 
  }

  // 2. Fetch the SQL definition from Master DB
  const masterPool = await getMasterPool();
  const widgetDef = await masterPool.request()
    .input("Id", sql.Int, dbWidgetId)
    .input("UserId", sql.Int, userId) // Security: Ensure user owns the widget
    .query(`SELECT SqlQuery FROM SavedWidgets WHERE Id = @Id AND UserId = @UserId`);

  const row = widgetDef.recordset[0];
  if (!row) {
    throw new Error(`Widget #${widgetId} not found or access denied.`);
  }

  const sqlQuery = row.SqlQuery;

  // 3. Execute the SQL against the Analytics DB
  const analyticsPool = await getAnalyticsPool();
  
  try {
    // NOTE: In production, ensure the DB user for analyticsPool has READ-ONLY permissions
    const result = await analyticsPool.request().query(sqlQuery);
    return result.recordset;
  } catch (err: any) {
    console.error(`Failed to execute widget ${widgetId} query:`, err);
    throw new Error("Failed to retrieve widget data.");
  }
}
