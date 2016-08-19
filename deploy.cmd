rmdir /s /q %DEPLOYMENT_TARGET%\.vscode
rmdir /s /q %DEPLOYMENT_TARGET%\node_modules
rmdir /s /q %DEPLOYMENT_TARGET%\src
rmdir /s /q %DEPLOYMENT_TARGET%\typings
del /q %DEPLOYMENT_TARGET%\*


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