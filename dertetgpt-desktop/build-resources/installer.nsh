!include nsDialogs.nsh
!include LogicLib.nsh

Var ShortcutDialog
Var DesktopCheckbox
Var TaskbarCheckbox
Var CreateDesktopShortcutFlag
Var PinTaskbarFlag

!macro customPageAfterChangeDir
  Page custom ShortcutOptionsPageShow ShortcutOptionsPageLeave
!macroend

Function ShortcutOptionsPageShow
  nsDialogs::Create 1018
  Pop $ShortcutDialog
  ${If} $ShortcutDialog == error
    Abort
  ${EndIf}

  ${NSD_CreateCheckbox} 0 10u 100% 12u "Створити ярлик на робочому столі"
  Pop $DesktopCheckbox
  ${NSD_SetState} $DesktopCheckbox ${BST_CHECKED}

  ${NSD_CreateCheckbox} 0 30u 100% 12u "Закріпити на панелі завдань"
  Pop $TaskbarCheckbox
  ${NSD_SetState} $TaskbarCheckbox ${BST_UNCHECKED}

  ${NSD_CreateLabel} 0 55u 100% 40u "Примітка: закріплення на панелі завдань може не спрацювати на деяких версіях Windows — якщо так, після запуску просто клікніть правою кнопкою по застосунку на панелі завдань і оберіть «Закріпити на панелі завдань» вручну."
  Pop $1

  nsDialogs::Show
FunctionEnd

Function ShortcutOptionsPageLeave
  ${NSD_GetState} $DesktopCheckbox $CreateDesktopShortcutFlag
  ${NSD_GetState} $TaskbarCheckbox $PinTaskbarFlag
FunctionEnd

!macro customInstall
  ${If} $CreateDesktopShortcutFlag == ${BST_CHECKED}
    CreateShortCut "$newDesktopLink" "$appExe" "" "$appExe" 0 "" "" "${APP_DESCRIPTION}"
  ${EndIf}

  ${If} $PinTaskbarFlag == ${BST_CHECKED}
    # Best-effort only: Microsoft removed the programmatic "pin to taskbar" verb as a supported
    # public API starting with Windows 10 1809, specifically to stop installers from doing this
    # silently. This legacy Shell.Application verb still works on some systems and is a no-op
    # (fails silently, caught below) on others — hence the on-screen note above.
    FileOpen $9 "$PLUGINSDIR\pin.ps1" w
    FileWrite $9 'param($exePath)$\r$\n'
    FileWrite $9 'try {$\r$\n'
    FileWrite $9 '  $$dir = Split-Path $$exePath$\r$\n'
    FileWrite $9 '  $$name = Split-Path $$exePath -Leaf$\r$\n'
    FileWrite $9 '  $$shell = New-Object -ComObject Shell.Application$\r$\n'
    FileWrite $9 '  $$folder = $$shell.Namespace($$dir)$\r$\n'
    FileWrite $9 '  $$item = $$folder.ParseName($$name)$\r$\n'
    FileWrite $9 '  $$item.InvokeVerb("taskbarpin")$\r$\n'
    FileWrite $9 '} catch {}$\r$\n'
    FileClose $9
    nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -File "$PLUGINSDIR\pin.ps1" "$appExe"'
  ${EndIf}
!macroend
