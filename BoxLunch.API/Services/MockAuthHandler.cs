using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;

namespace BoxLunch.API.Services;

public class MockAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public MockAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder) : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var claims = new[] {
            new Claim(ClaimTypes.Name, "admin@demo.com"),
            new Claim("preferred_username", "admin@demo.com"),
            new Claim(ClaimTypes.Role, "Administrador"),
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString())
        };
        
        var identity = new ClaimsIdentity(claims, "Mock");
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, "MockScheme");

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
