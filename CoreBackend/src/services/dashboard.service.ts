import sql from "mssql";
import { getMasterPool } from "../db/masterDb";
import { getAnalyticsPool } from "../db/analyticsDb";

export async function getDashboardLayout(userId: number) {
  const pool = await getMasterPool();

  const result = await pool.request()
    .input("UserId", sql.Int, userId)
    .query(`
      SELECT TOP 1 *
      FROM Dashboards
      WHERE UserId = @UserId
      ORDER BY CreatedAt ASC
    `);

  const row = result.recordset[0];
  if (!row) {
    // no layout yet
    return {
      Id: null,
      LayoutJson: JSON.stringify({ widgets: [] })
    };
  }

  return {
    Id: row.Id,
    LayoutJson: row.LayoutJson as string
  };
}

export async function saveDashboardLayout(userId: number, layout: any) {
  const layoutJson = JSON.stringify(layout);
  const pool = await getMasterPool();

  const existing = await pool.request()
    .input("UserId", sql.Int, userId)
    .query(`
      SELECT TOP 1 Id
      FROM Dashboards
      WHERE UserId = @UserId
      ORDER BY CreatedAt ASC
    `);

  if (existing.recordset.length > 0) {
    const id = existing.recordset[0].Id as number;
    await pool.request()
      .input("Id", sql.Int, id)
      .input("LayoutJson", sql.NVarChar, layoutJson)
      .query(`
        UPDATE Dashboards
        SET LayoutJson = @LayoutJson, UpdatedAt = SYSUTCDATETIME()
        WHERE Id = @Id
      `);
  } else {
    await pool.request()
      .input("UserId", sql.Int, userId)
      .input("Name", sql.NVarChar, "Default Capacity Overview")
      .input("LayoutJson", sql.NVarChar, layoutJson)
      .query(`
        INSERT INTO Dashboards (UserId, Name, LayoutJson)
        VALUES (@UserId, @Name, @LayoutJson)
      `);
  }
}

// Simple widget data based on widget id (you can refine later)
export async function getWidgetData(userId: number, widgetId: string) {
  // For now, userId is not used in query, but could be used for scoping later
  const pool = await getAnalyticsPool();

  if (widgetId === "cpu_30d") {
    const result = await pool.request().query(`
      SELECT
        DeviceName,
        CAST(DataCollectionDate AS DATE) AS BucketDate,
        AVG(DataValue) AS AvgCpu
      FROM AnalyticsDB.dbo.CpuPerformance
      WHERE DataCollectionDate >= DATEADD(DAY, -30, SYSUTCDATETIME())
      GROUP BY DeviceName, CAST(DataCollectionDate AS DATE)
      ORDER BY BucketDate, DeviceName;
    `);
    return result.recordset;
  }

  if (widgetId === "memory_30d") {
    const result = await pool.request().query(`
      SELECT
        DeviceName,
        CAST(DataCollectionDate AS DATE) AS BucketDate,
        AVG(DataValue) AS AvgMemory
      FROM AnalyticsDB.dbo.MemoryPerformance
      WHERE DataCollectionDate >= DATEADD(DAY, -30, SYSUTCDATETIME())
      GROUP BY DeviceName, CAST(DataCollectionDate AS DATE)
      ORDER BY BucketDate, DeviceName;
    `);
    return result.recordset;
  }

  if (widgetId === "disk_usage") {
    const result = await pool.request().query(`
      SELECT
        DeviceName,
        Instance,
        AVG(DataValue) AS AvgDiskUtilization
      FROM AnalyticsDB.dbo.DiskPerformance
      WHERE DataCollectionDate >= DATEADD(DAY, -7, SYSUTCDATETIME())
      GROUP BY DeviceName, Instance
      ORDER BY AvgDiskUtilization DESC;
    `);
    return result.recordset;
  }

  // default: nothing known
  return [];
}
