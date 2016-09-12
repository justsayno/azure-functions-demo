IF EXIST "%DEPLOYMENT_TARGET%\package.json" (
  pushd "%DEPLOYMENT_TARGET%"
  call :ExecuteCmd !NPM_CMD! install --development
  IF !ERRORLEVEL! NEQ 0 goto error
  popd
)
call :ExecuteCmd !NPM_CMD! run build