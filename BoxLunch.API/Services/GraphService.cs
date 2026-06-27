// using Azure.Identity;
// using Microsoft.Graph;
// using Microsoft.Graph.Models;

namespace BoxLunch.API.Services;

/// <summary>
/// MODO PORTAFOLIO: Este servicio ha sido modificado para devolver datos simulados.
/// El código original de integración con Microsoft Graph API se ha dejado comentado
/// al final del archivo para referencia.
/// </summary>
public class GraphService
{
    private readonly ILogger<GraphService> _logger;

    public GraphService(IConfiguration config, ILogger<GraphService> logger)
    {
        _logger = logger;
        _logger.LogInformation("[GraphService] Iniciando en MODO PORTAFOLIO (Mock).");
    }

    public async Task<List<EmpleadoGraphDto>> GetAllUsersAsync()
    {
        await Task.Delay(100); // Simulate network delay
        return new List<EmpleadoGraphDto>
        {
            new("EMP-001", "Juan Ernesto Gutiérrez Díaz", "juan.gutierrez@demo.com", "N-1001", "Coordinador", "Marketing"),
            new("EMP-002", "Francisco Ernesto Castro Rodríguez", "francisco.castro@demo.com", "N-1002", "Analista", "Logística"),
            new("EMP-003", "Carlos Enrique Reyes Herrera", "carlos.reyes@demo.com", "N-1003", "Supervisor", "TI"),
            new("EMP-004", "David Agustín Castro Méndez", "david.castro@demo.com", "N-1004", "Consultor", "Marketing"),
            new("EMP-005", "María Irene Gómez Chávez", "maria.gomez@demo.com", "N-1005", "Ingeniero", "RRHH"),
            new("EMP-006", "Pedro Felipe Ortiz Sánchez", "pedro.ortiz@demo.com", "N-1006", "Ejecutivo", "Finanzas"),
            new("EMP-007", "Fernando Tomás Moreno Salazar", "fernando.moreno@demo.com", "N-1007", "Analista", "Operaciones"),
            new("EMP-008", "Diana Fernanda Romero Rodríguez", "diana.romero@demo.com", "N-1008", "Ingeniero", "Legal"),
            new("EMP-009", "Alejandra Elena Pérez López", "alejandra.perez@demo.com", "N-1009", "Ingeniero", "Marketing"),
            new("EMP-010", "Alejandro Tomás Sánchez Romero", "alejandro.sanchez@demo.com", "N-1010", "Consultor", "Operaciones"),
            new("EMP-011", "Silvia Margarita Moreno Jiménez", "silvia.moreno@demo.com", "N-1011", "Especialista", "Operaciones"),
            new("EMP-012", "Hugo Ernesto Díaz Gómez", "hugo.diaz@demo.com", "N-1012", "Ejecutivo", "Administración"),
            new("EMP-013", "Daniela Luisa Vargas Reyes", "daniela.vargas@demo.com", "N-1013", "Analista", "RRHH"),
            new("EMP-014", "José Felipe Aguilar Álvarez", "jose.aguilar@demo.com", "N-1014", "Especialista", "Operaciones"),
            new("EMP-015", "Mario Gerardo Aguilar Jiménez", "mario.aguilar@demo.com", "N-1015", "Ejecutivo", "Administración"),
            new("EMP-016", "Rosa Cecilia Cruz Díaz", "rosa.cruz@demo.com", "N-1016", "Supervisor", "Legal"),
            new("EMP-017", "Lucía Victoria Chávez Rojas", "lucia.chavez@demo.com", "N-1017", "Desarrollador", "Logística"),
            new("EMP-018", "Jorge Esteban Domínguez Rodríguez", "jorge.dominguez@demo.com", "N-1018", "Especialista", "TI"),
            new("EMP-019", "Héctor Alberto Chávez Salazar", "hector.chavez@demo.com", "N-1019", "Ejecutivo", "Finanzas"),
            new("EMP-020", "Verónica Cristina Medina Torres", "veronica.medina@demo.com", "N-1020", "Analista", "Legal"),
            new("EMP-021", "Francisco Gerardo Castro Gutiérrez", "francisco.g.castro@demo.com", "N-1021", "Especialista", "RRHH"),
            new("EMP-022", "Claudia Isabel Juárez García", "claudia.juarez@demo.com", "N-1022", "Supervisor", "Operaciones"),
            new("EMP-023", "Daniel Gerardo Sánchez Hernández", "daniel.sanchez@demo.com", "N-1023", "Supervisor", "Operaciones"),
            new("EMP-024", "Jorge Alfonso Gómez Castro", "jorge.gomez@demo.com", "N-1024", "Analista", "Legal"),
            new("EMP-025", "Lorena Guadalupe Ramírez Castillo", "lorena.ramirez@demo.com", "N-1025", "Asistente", "Operaciones"),
            new("EMP-026", "Alejandro Gerardo Guzmán Rodríguez", "alejandro.guzman@demo.com", "N-1026", "Consultor", "Finanzas"),
            new("EMP-027", "Andrés Esteban Cruz Cruz", "andres.cruz@demo.com", "N-1027", "Supervisor", "Administración"),
            new("EMP-028", "Manuel Esteban Salazar Chávez", "manuel.salazar@demo.com", "N-1028", "Supervisor", "Marketing"),
            new("EMP-029", "David Eduardo Álvarez Castillo", "david.alvarez@demo.com", "N-1029", "Supervisor", "Administración"),
            new("EMP-030", "Carmen Elena Reyes Pérez", "carmen.reyes@demo.com", "N-1030", "Analista", "RRHH"),
            new("EMP-031", "Mario Enrique García Pérez", "mario.garcia@demo.com", "N-1031", "Asistente", "TI"),
            new("EMP-032", "José Tomás Ortiz Pérez", "jose.ortiz@demo.com", "N-1032", "Asistente", "Legal"),
            new("EMP-033", "Elena Cristina Jiménez Castro", "elena.jimenez@demo.com", "N-1033", "Consultor", "Ventas"),
            new("EMP-034", "Javier Felipe Méndez Vázquez", "javier.mendez@demo.com", "N-1034", "Especialista", "Finanzas"),
            new("EMP-035", "Gabriela Teresa Méndez Juárez", "gabriela.mendez@demo.com", "N-1035", "Especialista", "TI"),
            new("EMP-036", "Diego Ernesto Ortiz Sánchez", "diego.ortiz@demo.com", "N-1036", "Asistente", "Marketing"),
            new("EMP-037", "Hugo Ignacio Cruz Chávez", "hugo.cruz@demo.com", "N-1037", "Ingeniero", "Ventas"),
            new("EMP-038", "Leticia Carolina Pérez Rivera", "leticia.perez@demo.com", "N-1038", "Especialista", "Legal"),
            new("EMP-039", "Héctor Esteban García Rodríguez", "hector.garcia@demo.com", "N-1039", "Coordinador", "Marketing"),
            new("EMP-040", "Lorena Cristina Jiménez Álvarez", "lorena.jimenez@demo.com", "N-1040", "Coordinador", "TI"),
            new("EMP-041", "María Teresa Torres Juárez", "maria.torres@demo.com", "N-1041", "Ejecutivo", "Operaciones"),
            new("EMP-042", "Rosa Elena Ruiz Jiménez", "rosa.ruiz@demo.com", "N-1042", "Supervisor", "TI"),
            new("EMP-043", "Gabriel Alfonso González González", "gabriel.gonzalez@demo.com", "N-1043", "Supervisor", "Administración"),
            new("EMP-044", "José Esteban Rodríguez Morales", "jose.rodriguez@demo.com", "N-1044", "Especialista", "Finanzas"),
            new("EMP-045", "Diego Manuel Guzmán Díaz", "diego.guzman@demo.com", "N-1045", "Especialista", "TI"),
            new("EMP-046", "Elena Victoria Guzmán Medina", "elena.guzman@demo.com", "N-1046", "Ingeniero", "RRHH"),
            new("EMP-047", "Francisco Ernesto Aguilar Díaz", "francisco.aguilar@demo.com", "N-1047", "Ejecutivo", "Operaciones"),
            new("EMP-048", "Francisco Agustín Mendoza Juárez", "francisco.mendoza@demo.com", "N-1048", "Especialista", "RRHH"),
            new("EMP-049", "Eduardo Ramiro Guzmán Sánchez", "eduardo.guzman@demo.com", "N-1049", "Supervisor", "Finanzas"),
            new("EMP-050", "Daniel Eduardo Cruz Moreno", "daniel.cruz@demo.com", "N-1050", "Asistente", "Finanzas"),
            new("EMP-051", "Martha Isabel Rivera Castro", "martha.rivera@demo.com", "N-1051", "Supervisor", "Operaciones"),
            new("EMP-052", "Francisco Tomás Vargas Mendoza", "francisco.vargas@demo.com", "N-1052", "Coordinador", "Finanzas"),
            new("EMP-053", "Carmen Paola Sánchez Vargas", "carmen.sanchez@demo.com", "N-1053", "Ingeniero", "Ventas"),
            new("EMP-054", "Verónica Elena Ortiz Jiménez", "veronica.ortiz@demo.com", "N-1054", "Supervisor", "Operaciones"),
            new("EMP-055", "Mónica Paola González Rodríguez", "monica.gonzalez@demo.com", "N-1055", "Ingeniero", "Logística"),
            new("EMP-056", "Juan Alfonso Cruz Hernández", "juan.cruz@demo.com", "N-1056", "Coordinador", "Operaciones"),
            new("EMP-057", "Diana Luisa Chávez Vargas", "diana.chavez@demo.com", "N-1057", "Especialista", "TI"),
            new("EMP-058", "David Gerardo Flores Castro", "david.flores@demo.com", "N-1058", "Desarrollador", "TI"),
            new("EMP-059", "Ricardo Alberto López Mendoza", "ricardo.lopez@demo.com", "N-1059", "Analista", "RRHH"),
            new("EMP-060", "Teresa Beatriz Díaz Sánchez", "teresa.diaz@demo.com", "N-1060", "Supervisor", "RRHH"),
            new("EMP-061", "Verónica Luisa Flores Díaz", "veronica.flores@demo.com", "N-1061", "Coordinador", "Ventas"),
            new("EMP-062", "María Isabel Ortiz Méndez", "maria.ortiz@demo.com", "N-1062", "Ingeniero", "Marketing"),
            new("EMP-063", "David Manuel Romero López", "david.romero@demo.com", "N-1063", "Asistente", "Administración"),
            new("EMP-064", "Eduardo Alfonso Mendoza Reyes", "eduardo.mendoza@demo.com", "N-1064", "Analista", "Marketing"),
            new("EMP-065", "Diego Alfonso Gutiérrez Pérez", "diego.gutierrez@demo.com", "N-1065", "Desarrollador", "Operaciones"),
            new("EMP-066", "Elena Carolina Castro Ortiz", "elena.castro@demo.com", "N-1066", "Especialista", "TI"),
            new("EMP-067", "Silvia Victoria Torres López", "silvia.torres@demo.com", "N-1067", "Ejecutivo", "Finanzas"),
            new("EMP-068", "Lucía Irene Aguilar Chávez", "lucia.aguilar@demo.com", "N-1068", "Especialista", "Legal"),
            new("EMP-069", "Alejandra Elena Torres López", "alejandra.torres@demo.com", "N-1069", "Analista", "Logística"),
            new("EMP-070", "Fernando Arturo Pérez Ortiz", "fernando.perez@demo.com", "N-1070", "Especialista", "RRHH"),
            new("EMP-071", "Susana Cecilia Méndez Aguilar", "susana.mendez@demo.com", "N-1071", "Ingeniero", "Logística"),
            new("EMP-072", "Pedro Arturo Romero Morales", "pedro.romero@demo.com", "N-1072", "Ejecutivo", "Operaciones"),
            new("EMP-073", "Raúl Eduardo Jiménez Chávez", "raul.jimenez@demo.com", "N-1073", "Consultor", "RRHH"),
            new("EMP-074", "Beatriz Beatriz Jiménez Herrera", "beatriz.jimenez@demo.com", "N-1074", "Coordinador", "Administración"),
            new("EMP-075", "Raúl Esteban Hernández Muñoz", "raul.hernandez@demo.com", "N-1075", "Especialista", "RRHH"),
            new("EMP-076", "Francisco Eduardo Reyes Vázquez", "francisco.reyes@demo.com", "N-1076", "Analista", "Ventas"),
            new("EMP-077", "Alejandro Ignacio Muñoz Pérez", "alejandro.muñoz@demo.com", "N-1077", "Ejecutivo", "Administración"),
            new("EMP-078", "David Ernesto Romero Domínguez", "david.e.romero@demo.com", "N-1078", "Asistente", "Logística"),
            new("EMP-079", "Héctor Ernesto García Sánchez", "hector.e.garcia@demo.com", "N-1079", "Asistente", "Logística"),
            new("EMP-080", "David Esteban Juárez González", "david.juarez@demo.com", "N-1080", "Asistente", "Legal"),
            new("EMP-081", "Eduardo Alberto Juárez Medina", "eduardo.juarez@demo.com", "N-1081", "Desarrollador", "Legal"),
            new("EMP-082", "Verónica Carolina Herrera Chávez", "veronica.herrera@demo.com", "N-1082", "Consultor", "Legal"),
            new("EMP-083", "Gabriel Tomás Ramos Rivera", "gabriel.ramos@demo.com", "N-1083", "Asistente", "Operaciones"),
            new("EMP-084", "Paula Irene Medina Domínguez", "paula.medina@demo.com", "N-1084", "Ingeniero", "Marketing"),
            new("EMP-085", "Laura Luisa Ruiz Díaz", "laura.ruiz@demo.com", "N-1085", "Desarrollador", "Operaciones"),
            new("EMP-086", "Diana Fernanda Cruz Flores", "diana.cruz@demo.com", "N-1086", "Ejecutivo", "Marketing"),
            new("EMP-087", "David Enrique Pérez Méndez", "david.perez@demo.com", "N-1087", "Desarrollador", "Logística"),
            new("EMP-088", "Claudia Guadalupe Jiménez Méndez", "claudia.jimenez@demo.com", "N-1088", "Analista", "Logística"),
            new("EMP-089", "Lorena Guadalupe Moreno Mendoza", "lorena.moreno@demo.com", "N-1089", "Ejecutivo", "Logística"),
            new("EMP-090", "Javier Enrique Gutiérrez Chávez", "javier.gutierrez@demo.com", "N-1090", "Analista", "Administración"),
            new("EMP-091", "Patricia Beatriz Álvarez Gómez", "patricia.alvarez@demo.com", "N-1091", "Coordinador", "Administración"),
            new("EMP-092", "Diego Ramiro Guzmán Martínez", "diego.r.guzman@demo.com", "N-1092", "Ejecutivo", "Finanzas"),
            new("EMP-093", "Eduardo Alberto González Torres", "eduardo.gonzalez@demo.com", "N-1093", "Desarrollador", "Logística"),
            new("EMP-094", "Eduardo Alfonso Ortiz Romero", "eduardo.ortiz@demo.com", "N-1094", "Ejecutivo", "Operaciones"),
            new("EMP-095", "Laura Cristina Martínez Castro", "laura.martinez@demo.com", "N-1095", "Desarrollador", "TI"),
            new("EMP-096", "Héctor Manuel López Martínez", "hector.lopez@demo.com", "N-1096", "Asistente", "Marketing"),
            new("EMP-097", "Víctor Alberto Díaz Cruz", "victor.diaz@demo.com", "N-1097", "Especialista", "Administración"),
            new("EMP-098", "Eduardo Ernesto Torres Castillo", "eduardo.torres@demo.com", "N-1098", "Especialista", "Ventas"),
            new("EMP-099", "Raúl Manuel Rojas Martínez", "raul.rojas@demo.com", "N-1099", "Ejecutivo", "Operaciones"),
            new("EMP-100", "Sofía Elena Pérez Rojas", "sofia.perez@demo.com", "N-1100", "Especialista", "Marketing")
        };
    }

    private static readonly string[] EmployeeGenders = new[]
    {
        "M", "M", "M", "M", "F", "M", "M", "F", "F", "M", // 1-10
        "F", "M", "F", "M", "M", "F", "F", "M", "M", "F", // 11-20
        "M", "F", "M", "M", "F", "M", "M", "M", "M", "F", // 21-30
        "M", "M", "F", "M", "F", "M", "M", "F", "M", "F", // 31-40
        "F", "F", "M", "M", "M", "F", "M", "M", "M", "M", // 41-50
        "F", "M", "F", "F", "F", "M", "F", "M", "M", "F", // 51-60
        "F", "F", "M", "M", "M", "F", "F", "F", "F", "M", // 61-70
        "F", "M", "M", "F", "M", "M", "M", "M", "M", "M", // 71-80
        "M", "F", "M", "F", "M", "F", "M", "F", "F", "M", // 81-90
        "F", "M", "M", "M", "F", "M", "M", "M", "M", "F"  // 91-100
    };

    public async Task<byte[]?> GetUserPhotoAsync(string entraObjectId)
    {
        if (string.IsNullOrEmpty(entraObjectId)) return null;

        string? photoUrl = null;

        if (entraObjectId == "demo-admin") photoUrl = "https://randomuser.me/api/portraits/men/95.jpg";
        else if (entraObjectId == "demo-operativo") photoUrl = "https://randomuser.me/api/portraits/men/96.jpg";
        else if (entraObjectId == "demo-desarrollador") photoUrl = "https://randomuser.me/api/portraits/women/95.jpg";
        else if (entraObjectId.StartsWith("EMP-"))
        {
            if (int.TryParse(entraObjectId.Substring(4), out var num) && num >= 1 && num <= 100)
            {
                // Dejar 4 sin fotografía (ej. 13, 37, 77, 91)
                if (num == 13 || num == 37 || num == 77 || num == 91)
                {
                    return null;
                }

                int sameGenderCount = 0;
                string targetGender = EmployeeGenders[num - 1];
                for (int i = 0; i < num; i++)
                {
                    if (EmployeeGenders[i] == targetGender)
                    {
                        sameGenderCount++;
                    }
                }

                string folder = targetGender == "F" ? "women" : "men";
                photoUrl = $"https://randomuser.me/api/portraits/{folder}/{sameGenderCount}.jpg";
            }
        }

        if (string.IsNullOrEmpty(photoUrl))
        {
            photoUrl = "https://api.dicebear.com/7.x/initials/png?seed=" + entraObjectId;
        }

        try {
            using var client = new HttpClient();
            return await client.GetByteArrayAsync(photoUrl);
        } catch {
            return null;
        }
    }

    public async Task<string?> GetUserPhotoBase64Async(string entraObjectId)
    {
        var bytes = await GetUserPhotoAsync(entraObjectId);
        if (bytes != null)
        {
            return Convert.ToBase64String(bytes);
        }
        return null;
    }

    public async Task<EmpleadoGraphDto?> GetUserByEmailAsync(string email)
    {
        await Task.Delay(100);
        var users = await GetAllUsersAsync();
        return users.FirstOrDefault(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
    }
}

public record EmpleadoGraphDto(
    string Id,
    string NombreCompleto,
    string Email,
    string? NumeroNomina,
    string? Puesto,
    string? Departamento
);

/* =========================================================================
 * CÓDIGO ORIGINAL (Integración real con Microsoft Graph)
 * Dejado comentado para referencia en el portafolio.
 * =========================================================================

using Azure.Identity;
using Microsoft.Graph;
using Microsoft.Graph.Models;



/// <summary>
/// Servicio para consultar datos de empleados desde Microsoft Graph API.
/// Lee nombres, emails y fotos de perfil directamente desde el directorio
/// de la empresa en Microsoft Entra ID (Azure AD), sin necesitar Dataverse.
public class OriginalGraphService
{
    private readonly GraphServiceClient? _graphClient;
    private readonly ILogger<GraphService> _logger;
    private readonly bool _isMock = false;

    public GraphService(IConfiguration config, ILogger<GraphService> logger)
    {
        _logger = logger;

        var tenantId = config["AzureAd:TenantId"];
        var clientId = config["AzureAd:ClientId"];
        var clientSecret = config["AzureAd:ClientSecret"];

        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
        {
            _isMock = true;
            _logger.LogWarning("[GraphService] Credenciales no encontradas. Iniciando en MODO MOCK.");
            return;
        }

        var credential = new ClientSecretCredential(tenantId!, clientId, clientSecret);
        _graphClient = new GraphServiceClient(credential);
    }

    /// <summary>
    /// Obtiene la lista de todos los usuarios activos de la organización.
    /// Requiere permiso: User.Read.All (con consentimiento de administrador).
    /// </summary>
    public async Task<List<EmpleadoGraphDto>> GetAllUsersAsync()
    {
        if (_isMock)
        {
            return new List<EmpleadoGraphDto>
            {
                new("mock-1", "Ana García", "ana.garcia@ejemplo.com", "EMP-1000", "Analista", "TI"),
                new("mock-2", "Carlos Rodríguez", "carlos.rodriguez@ejemplo.com", "EMP-1001", "Gerente", "Ventas"),
                new("mock-3", "Karla Medina", "admin@demo.com", "EMP-9999", "Admin", "Sistemas")
            };
        }

        try
        {
            var allUsers = new List<User>();
            var response = await _graphClient!.Users.GetAsync(req =>
            {
                req.QueryParameters.Select = ["id", "displayName", "mail", "userPrincipalName", "employeeId", "jobTitle", "department"];
                req.QueryParameters.Filter = "accountEnabled eq true";
                req.QueryParameters.Top = 999; 
            });

            if (response?.Value != null)
            {
                allUsers.AddRange(response.Value);

                // Seguir el enlace de la siguiente página si existe
                var nextLink = response.OdataNextLink;
                while (!string.IsNullOrEmpty(nextLink))
                {
                    _logger.LogInformation("[GraphService] Recuperando siguiente página: {Link}", nextLink);
                    var nextResponse = await _graphClient.Users.WithUrl(nextLink).GetAsync();
                    if (nextResponse?.Value != null)
                    {
                        allUsers.AddRange(nextResponse.Value);
                    }
                    nextLink = nextResponse?.OdataNextLink;
                }
            }

            _logger.LogInformation("[GraphService] Sincronización completa: {Count} usuarios recuperados.", allUsers.Count);

            return allUsers.Select(u => new EmpleadoGraphDto(
                Id: u.Id ?? string.Empty,
                NombreCompleto: u.DisplayName ?? string.Empty,
                Email: u.Mail ?? u.UserPrincipalName ?? string.Empty,
                NumeroNomina: u.EmployeeId,
                Puesto: u.JobTitle,
                Departamento: u.Department
            )).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[GraphService] Error al conectar con Microsoft Graph API");
            throw;
        }
    }

    /// <summary>
    /// Obtiene la foto de perfil de un usuario por su Object ID de Entra.
    /// Retorna null si no tiene foto configurada.
    /// </summary>
    public async Task<byte[]?> GetUserPhotoAsync(string entraObjectId)
    {
        if (_isMock) return null; // No hay fotos en modo mock por ahora

        try
        {
            var photoStream = await _graphClient!.Users[entraObjectId].Photo.Content.GetAsync();
            if (photoStream is null) return null;

            using var ms = new MemoryStream();
            await photoStream.CopyToAsync(ms);
            return ms.ToArray();
        }
        catch (Exception ex)
        {
            _logger.LogWarning("[GraphService] Sin foto para {Id}: {Msg}", entraObjectId, ex.Message);
            return null;
        }
    }

    /// <summary>
    /// Obtiene la foto de perfil y la regresa como Data URL base64 (lista para usar en img src).
    /// </summary>
    public async Task<string?> GetUserPhotoBase64Async(string entraObjectId)
    {
        var bytes = await GetUserPhotoAsync(entraObjectId);
        if (bytes is null) return null;
        return $"data:image/jpeg;base64,{Convert.ToBase64String(bytes)}";
    }

    /// <summary>
    /// Busca un usuario de Entra ID por email.
    /// </summary>
    public async Task<EmpleadoGraphDto?> GetUserByEmailAsync(string email)
    {
        if (_isMock)
        {
            if (email == "admin@demo.com")
                return new EmpleadoGraphDto("mock-3", "Karla Medina", "admin@demo.com", "EMP-9999", "Admin", "Sistemas");
            
            return null;
        }

        try
        {
            var users = await _graphClient!.Users.GetAsync(req =>
            {
                req.QueryParameters.Filter = $"mail eq '{email}' or userPrincipalName eq '{email}'";
                req.QueryParameters.Select = ["id", "displayName", "mail", "userPrincipalName", "employeeId"];
                req.QueryParameters.Top = 1;
            });

            var u = users?.Value?.FirstOrDefault();
            if (u is null) return null;

            return new EmpleadoGraphDto(
                Id: u.Id ?? string.Empty,
                NombreCompleto: u.DisplayName ?? string.Empty,
                Email: u.Mail ?? u.UserPrincipalName ?? string.Empty,
                NumeroNomina: u.EmployeeId,
                Puesto: u.JobTitle,
                Departamento: u.Department
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[GraphService] Error buscando usuario por email: {Email}", email);
            return null;
        }
    }
}

public record EmpleadoGraphDto(
    string Id,
    string NombreCompleto,
    string Email,
    string? NumeroNomina,
    string? Puesto,
    string? Departamento
);

*/
