rmdir %DEPLOYMENT_TARGET%\.vscode /s /q
rmdir %DEPLOYMENT_TARGET%\node_modules /s /q
rmdir %DEPLOYMENT_TARGET%\src /s /q
rmdir %DEPLOYMENT_TARGET%\typings /s /q
dir

xcopy %DEPLOYMENT_SOURCE%\dist %DEPLOYMENT_TARGET% /Y /E
rmdir %DEPLOYMENT_TARGET%\dist
IF "%ERRORLEVEL%" NEQ "0" goto error

goto end

:error
endlocal
echo An error has occurred during web site deployment.  
call :exitSetErrorLevel  
call :exitFromFunction 2>nul

:exitSetErrorLevel
exit /b 1

:exitFromFunction
()

:end
endlocal  
echo Finished successfully. 