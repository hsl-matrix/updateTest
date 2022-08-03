using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System;

public class Startup
{
    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern short GlobalAddAtomA(string lpString);

    public async Task<object> Invoke(dynamic input)
    {
      uint atom = (uint)GlobalAddAtomA(input.lpBuf);
        
      return (UIntPtr)atom ;
    }
}