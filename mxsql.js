// Shared SQL helpers for the Maximo BIRT report packs: one dialect per database (Microsoft SQL Server, Oracle, IBM Db2).
// Built into each report by its build.py; Maximo only needs the .rptdesign.
// Created by Mohamed Chihaoui.
function mxCodes(csv, dflt) {
  var out = [], raw = String(csv == null || csv === "" ? dflt : csv).split(",");
  for (var i = 0; i < raw.length; i++) {
    var v = raw[i].replace(/^\s+|\s+$/g, "").toUpperCase();
    if (v.length > 0 && /^[A-Z0-9_\-]+$/.test(v)) out.push("'" + v + "'");
  }
  return out.length ? out.join(",") : "'~'";
}

function mxSite(site) {
  var s = String(site == null ? "" : site).replace(/^\s+|\s+$/g, "").toUpperCase();
  return /^[A-Z0-9_\-]+$/.test(s) ? s : "";
}

// work orders reported per month (the report picks its period from it) and the Maximo version
function mxPeriodSql(db, site, tag) {
  var ORA = db == "oracle", s = mxSite(site);
  var y = ORA ? "extract(year from w.reportdate)" : "year(w.reportdate)";
  var m = ORA ? "extract(month from w.reportdate)" : "month(w.reportdate)";
  return "select /* " + tag + " */ " + y + " yr, " + m + " mo, count(*) n, v.upg upg from workorder w " +
         "cross join (select max(varvalue) upg from maxvars where varname = 'MAXUPG') v " +
         "where w.woclass = 'WORKORDER' and w.istask = 0 and w.reportdate is not null" +
         (s ? " and w.siteid = '" + s + "'" : "") + " group by " + y + ", " + m + ", v.upg";
}

function mxDialect(db, site, tag) {
  var SS = db == "sqlserver", ORA = db == "oracle", DB2 = !SS && !ORA;
  var x = { SS: SS, ORA: ORA, DB2: DB2, site: mxSite(site) };
  x.DUAL = ORA ? " from dual" : DB2 ? " from sysibm.sysdummy1" : "";
  x.d = function (s) {   // date literal YYYY-MM-DD
    if (SS) return "cast('" + s + "' as datetime)";
    if (ORA) return "to_date('" + s + "', 'YYYY-MM-DD')";
    return "timestamp('" + s + " 00:00:00')";
  };
  x.hrs = function (a, b) {   // hours from a to b
    if (SS) return "(datediff(minute, " + a + ", " + b + ") / 60.0)";
    if (ORA) return "((" + b + " - " + a + ") * 24)";
    return "(((days(" + b + ") - days(" + a + ")) * 86400 + (midnight_seconds(" + b + ") - midnight_seconds(" + a + "))) / 3600.0)";
  };
  x.dys = function (a, b) { return "(" + x.hrs(a, b) + " / 24.0)"; };
  x.ym = function (c) { return SS ? "convert(char(7), " + c + ", 120)" : ORA ? "to_char(" + c + ", 'YYYY-MM')" : "varchar_format(" + c + ", 'YYYY-MM')"; };
  x.str = function (c) { return SS ? "cast(" + c + " as varchar(60))" : ORA ? "to_char(" + c + ")" : "trim(cast(" + c + " as char(60)))"; };
  x.limit = function (sql, n) {
    if (SS) return "select top " + n + " " + sql.substring(7);
    if (ORA) return "select * from (" + sql + ") where rownum <= " + n;
    return sql + " fetch first " + n + " rows only";
  };
  x.mark = function (sql) { return sql.replace(/^select /, "select /* " + tag + " */ "); };
  x.siteF = function (a) { return x.site ? " and " + a + ".siteid = '" + x.site + "'" : ""; };
  x.nz = function (c) { return "coalesce(" + c + ", 0)"; };
  x.sumIf = function (cond, expr) { return "sum(case when " + cond + " then " + expr + " else 0 end)"; };
  x.cntIf = function (cond) { return x.sumIf(cond, "1"); };
  // work order with its status synonym (renamed statuses count correctly)
  x.wo = function (w, st) {
    return "workorder " + w + " join synonymdomain " + st + " on " + st + ".domainid = 'WOSTATUS' and " + st + ".value = " + w + ".status";
  };
  x.cost = function (w) {
    return "(" + x.nz(w + ".actlabcost") + " + " + x.nz(w + ".actmatcost") + " + " + x.nz(w + ".actservcost") + " + " + x.nz(w + ".acttoolcost") + ")";
  };
  x.operating = function (a, sa) {
    return "asset " + a + " join synonymdomain " + sa + " on " + sa + ".domainid = 'LOCASSETSTATUS' and " + sa + ".value = " + a + ".status";
  };
  return x;
}

if (typeof module !== "undefined") module.exports = { mxCodes: mxCodes, mxSite: mxSite, mxPeriodSql: mxPeriodSql, mxDialect: mxDialect };
