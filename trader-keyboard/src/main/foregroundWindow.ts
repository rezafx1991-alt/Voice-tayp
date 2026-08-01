import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { logger } from './logger';
import { ForegroundWindowInfo } from '../shared/types';

const execAsync = promisify(exec);

/**
 * Uses a short PowerShell snippet (bundled with every Windows 10/11 install,
 * no extra dependency needed) to read the title and owning process of the
 * currently focused window. Used only for display purposes in the UI (e.g.
 * "Typing into: Telegram Desktop") — never for automation decisions, so a
 * failure here is safe to swallow.
 */
export async function getForegroundWindowInfo(): Promise<ForegroundWindowInfo | null> {
  if (process.platform !== 'win32') {
    return null;
  }

  // Use -EncodedCommand (Base64-encoded UTF-16LE) to avoid all shell-quoting
  // issues with multi-line scripts containing double-quotes and special chars.
  const script = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class Win32 {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
}
"@
$hwnd = [Win32]::GetForegroundWindow()
$sb = New-Object System.Text.StringBuilder 256
[Win32]::GetWindowText($hwnd, $sb, 256) | Out-Null
$procId = 0
[Win32]::GetWindowThreadProcessId($hwnd, [ref]$procId) | Out-Null
$proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
Write-Output ($sb.ToString() + "|" + $(if ($proc) { $proc.ProcessName } else { "" }))
`.trim();

  // Encode as UTF-16LE + Base64 — the format PowerShell -EncodedCommand expects.
  const encodedScript = Buffer.from(script, 'utf16le').toString('base64');

  try {
    const { stdout } = await execAsync(
      `powershell -NoProfile -NonInteractive -EncodedCommand ${encodedScript}`,
      { timeout: 2000 }
    );
    const [title, processName] = stdout.trim().split('|');
    return {
      title: title || '',
      processName: processName || null,
    };
  } catch (error) {
    logger.warn('getForegroundWindowInfo failed:', error);
    return null;
  }
}
