# Maximo Failure Data and Reliability (ISO 14224)

*Created by Mohamed Chihaoui*

One read-only BIRT report for IBM Maximo 7.6 (and Maximo Manage) that checks every failure work order against the data
**ISO 14224** asks for (equipment, equipment class, failure class, failure mode, cause, maintenance activity, repair time,
downtime), then shows what fails and why, reliability by equipment class, and the health of the failure code catalogue.
Runs on **SQL Server, Oracle and Db2** from the same file.

Import only `maximo_failure_data.rptdesign` into Maximo. `fd_sql.js` (and the shared `mxsql.js`) is the SQL source built into it.

## What is in it

| Section | Content |
|---|---|
| Header | Failures, fully coded share, and the share with a failure class, failure mode, cause, maintenance activity, repair times, downtime |
| 1 Data quality | Each ISO 14224 element, the Maximo field that holds it, its completeness and status; monthly coding chart; coding by site |
| 2 What fails and why | Paretos of failure classes, failure modes (problems), causes and maintenance activities (remedies) |
| 3 Reliability | MTBF and MTTR by equipment class; the failure code catalogue (classes without failure modes, classes not used); failure classes typed on work orders that the catalogue does not define |
| Appendix | Method and definitions |

## Parameters

Site, Months, End_Month (period), Corrective_Types and Emergency_Types (work types counted as failures; defaults CM,CMCAL and EM,EMCAL).

## Install

Reports (Administration) > New Report `maximo_failure_data.rptdesign` > Import Report > Generate Request Page > Preview.
Every statement is a SELECT that runs with the Maximo database login. Tested inside Maximo 7.6 on SQL Server, Oracle and Db2.

Created by Mohamed Chihaoui.
