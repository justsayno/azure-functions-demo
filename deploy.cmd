IF EXIST ".\package.json" (
  call :ExecuteCmd !NPM_CMD! install --development
  IF !ERRORLEVEL! NEQ 0 goto ERRORLEVEL
)
call :ExecuteCmd !NPM_CMD! run build