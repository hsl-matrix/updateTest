using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System;
using System.Diagnostics;
using Microsoft.Win32;

public class Startup
{
	private const int SCREEN_POP = 1005; //스크린 팝업	
	private uint m_ThreadID = 0;//스레드 아이디
	
    [DllImport("user32.dll")]
    public static extern bool PostThreadMessage(uint idThread, uint Msg, UIntPtr wParam, UIntPtr lParam);
    
    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern short GlobalAddAtomA(string lpString);

	private uint ReadOCXThread()
	{
		string str = null;
		RegistryKey rkey = Registry.LocalMachine.OpenSubKey("Software\\Saehan\\SoftphoneOCX");//레지스트 키를 검색
		str = (string)(rkey == null ? null : rkey.GetValue("OCXThreadID")); //OCXThreadID에 저장된 값을 변수에 저장

		return Convert.ToUInt32(str);
	}

    public async Task<object> Invoke(dynamic input)
    {
      //uint k = Convert.ToInt32(input.m_ThreadID);
      
      //uint m_ThreadID = Convert.ToUInt32(input.m_ThreadID, 16);
      m_ThreadID = ReadOCXThread();
      string lpBuf = input.UEIData;//Delivered이벤트에서 받은 데이터
	  
      uint atom = (uint)GlobalAddAtomA(lpBuf);//메모리에 쌓인 Atom값을 얻어옴
      //uint atom = Convert.ToUInt32(input.atom, 16);
      Console.WriteLine(atom);
      return PostThreadMessage(m_ThreadID, SCREEN_POP, (UIntPtr)0, (UIntPtr)atom); 
    }
}