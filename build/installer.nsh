; ==========================================
; Qubink Nexus™ Custom NSIS Installer Script
; ==========================================

; --- Custom Uninstall Prompts ---
!macro customUnInstall
  ; Ask user what to preserve during uninstall
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "Keep machine configuration and settings?$\n$\nSelecting YES will preserve your Machine ID, credentials, and printer settings." \
    IDYES KeepConfig IDNO DeleteConfig

  KeepConfig:
    DetailPrint "Preserving machine configuration..."
    Goto AskLogs

  DeleteConfig:
    DetailPrint "Removing machine configuration..."
    RMDir /r "$APPDATA\qubink-nexus\credentials"
    RMDir /r "$APPDATA\qubink-nexus\setup.json"
    Goto AskLogs

  AskLogs:
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "Keep application logs?$\n$\nLogs can help diagnose issues after reinstalling." \
    IDYES KeepLogs IDNO DeleteLogs

  KeepLogs:
    DetailPrint "Preserving application logs..."
    Goto DoneCleanup

  DeleteLogs:
    DetailPrint "Removing application logs..."
    Delete "$APPDATA\qubink-nexus\nexus.log"
    Delete "$APPDATA\qubink-nexus\*.log"
    Goto DoneCleanup

  DoneCleanup:
    DetailPrint "Uninstall cleanup complete."
!macroend

; --- Custom Install Welcome Banner ---
!macro customWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "Welcome to Qubink Nexus™ Setup"
  !define MUI_WELCOMEPAGE_TEXT "Qubink Nexus™ is the Smart Print ATM Machine Controller.$\n$\nThis wizard will guide you through the installation.$\n$\nClick Next to continue."
!macroend

; --- Desktop Shortcut ---
!macro customInstall
  CreateShortcut "$DESKTOP\Qubink Nexus.lnk" "$INSTDIR\Qubink Nexus.exe" "" "$INSTDIR\Qubink Nexus.exe" 0
  CreateDirectory "$SMPROGRAMS\Qubink"
  CreateShortcut "$SMPROGRAMS\Qubink\Qubink Nexus.lnk" "$INSTDIR\Qubink Nexus.exe"
  CreateShortcut "$SMPROGRAMS\Qubink\Uninstall Qubink Nexus.lnk" "$INSTDIR\Uninstall Qubink Nexus.exe"
  DetailPrint "Desktop and Start Menu shortcuts created."
!macroend
