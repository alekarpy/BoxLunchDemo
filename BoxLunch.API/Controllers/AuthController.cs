using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BoxLunch.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class AuthController(IConfiguration config) : ControllerBase
{
    [HttpGet("login")]
    public IActionResult Login()
    {
        // Redirigimos a la URL del frontend configurada en la variable de entorno (Railway: FrontendOrigin)
        var frontendOrigin = config["FrontendOrigin"] ?? "http://localhost:5173";
        return Challenge(new AuthenticationProperties { RedirectUri = frontendOrigin + "/boxlunch/" }, 
            OpenIdConnectDefaults.AuthenticationScheme);
    }

    [HttpGet("logout")]
    public IActionResult Logout()
    {
        var frontendOrigin = config["FrontendOrigin"];
        string redirectUrl;
        if (!string.IsNullOrEmpty(frontendOrigin))
        {
            frontendOrigin = frontendOrigin.TrimEnd('/');
            redirectUrl = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development" 
                ? $"{frontendOrigin}/" 
                : $"{frontendOrigin}/boxlunch/";
        }
        else
        {
            redirectUrl = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development" 
                ? "http://localhost:5173/" 
                : "/boxlunch/";
        }
            
        // Al cerrar sesión en modo portafolio, solo borramos las cookies locales y redirigimos
        return SignOut(
            new AuthenticationProperties { RedirectUri = redirectUrl }, 
            CookieAuthenticationDefaults.AuthenticationScheme
        );
    }

    [HttpGet("me")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public IActionResult Me()
    {
        Console.WriteLine($"\n>>> [GET /api/auth/me] Request URL: {Request.Scheme}://{Request.Host}{Request.Path}{Request.QueryString}");
        Console.WriteLine($">>> [GET /api/auth/me] Headers - Origin: {Request.Headers["Origin"]}, Referer: {Request.Headers["Referer"]}");
        Console.WriteLine($">>> [GET /api/auth/me] Cookies present: {Request.Cookies.Count}");
        foreach (var cookie in Request.Cookies)
        {
            Console.WriteLine($">>> [GET /api/auth/me] Cookie: {cookie.Key} = (length: {cookie.Value.Length})");
        }
        Console.WriteLine($">>> [GET /api/auth/me] HttpContext.User IsAuthenticated: {User.Identity?.IsAuthenticated}");
        if (User.Identity?.IsAuthenticated == true)
        {
            Console.WriteLine($">>> [GET /api/auth/me] Authenticated UPN: {User.Identity.Name}");
        }

        // Este es el "corazón" de la sesión para el frontend.
        // Si el usuario no está autenticado, devolverá 401 automáticamente.
        if (User.Identity?.IsAuthenticated != true)
        {
            Console.WriteLine(">>> [GET /api/auth/me] Result: Unauthorized (401)");
            return Unauthorized();
        }

        Console.WriteLine(">>> [GET /api/auth/me] Result: OK (200)");
        return Ok(new
        {
            Id = User.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value 
                 ?? User.FindFirst("oid")?.Value 
                 ?? User.FindFirst("sub")?.Value,
            DisplayName = User.FindFirst("name")?.Value ?? User.Identity.Name,
            UserPrincipalName = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn")?.Value 
                                ?? User.FindFirst("preferred_username")?.Value 
                                ?? User.Identity.Name,
            Mail = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value 
                   ?? User.FindFirst("email")?.Value
        });
    }
}
