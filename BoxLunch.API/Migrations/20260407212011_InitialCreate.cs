using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BoxLunch.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Empleados",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    NombreCompleto = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 320, nullable: false),
                    NumeroNomina = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    EntraObjectId = table.Column<string>(type: "TEXT", maxLength: 36, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Empleados", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RolesDelSistema",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    NombreDeRol = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    Descripcion = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RolesDelSistema", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UsuariosDeAcceso",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    NombreDeUsuario = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    CorreoElectronico = table.Column<string>(type: "TEXT", maxLength: 320, nullable: false),
                    Rol = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsuariosDeAcceso", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Notificaciones",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    NotificacionNombre = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    EmpleadoId = table.Column<Guid>(type: "TEXT", nullable: true),
                    Empleado1Id = table.Column<Guid>(type: "TEXT", nullable: true),
                    FechaHoraEntrega = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    LugarEntrega = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Mensaje = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notificaciones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notificaciones_Empleados_Empleado1Id",
                        column: x => x.Empleado1Id,
                        principalTable: "Empleados",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Notificaciones_Empleados_EmpleadoId",
                        column: x => x.EmpleadoId,
                        principalTable: "Empleados",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Pedidos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    PedidoNombre = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    EmpleadoId = table.Column<Guid>(type: "TEXT", nullable: true),
                    Empleado1Id = table.Column<Guid>(type: "TEXT", nullable: true),
                    Estatus = table.Column<string>(type: "TEXT", nullable: false),
                    FechaDeCreacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    FechaEntrega = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    HoraEntrega = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    LugarEntrega = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    MotivoCancelacion = table.Column<string>(type: "TEXT", nullable: true),
                    MotivoCancelacionTextoLibre = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pedidos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Pedidos_Empleados_Empleado1Id",
                        column: x => x.Empleado1Id,
                        principalTable: "Empleados",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Pedidos_Empleados_EmpleadoId",
                        column: x => x.EmpleadoId,
                        principalTable: "Empleados",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "AsignacionesRolUsuario",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Nombre = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    CorreoElectronico = table.Column<string>(type: "TEXT", maxLength: 320, nullable: false),
                    EstadoActivo = table.Column<bool>(type: "INTEGER", nullable: false),
                    FechaDeAsignacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    HistorialDeCambios = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: true),
                    RolDelSistemaId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AsignacionesRolUsuario", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AsignacionesRolUsuario_RolesDelSistema_RolDelSistemaId",
                        column: x => x.RolDelSistemaId,
                        principalTable: "RolesDelSistema",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "RolesDelSistema",
                columns: new[] { "Id", "Descripcion", "NombreDeRol" },
                values: new object[,]
                {
                    { new Guid("11111111-0000-0000-0000-000000000001"), "Acceso completo al sistema", "Administrador" },
                    { new Guid("11111111-0000-0000-0000-000000000002"), "Gestión de pedidos y notificaciones", "Operativo" },
                    { new Guid("11111111-0000-0000-0000-000000000003"), "Acceso técnico y diagnóstico del sistema", "Desarrollador" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_AsignacionesRolUsuario_RolDelSistemaId",
                table: "AsignacionesRolUsuario",
                column: "RolDelSistemaId");

            migrationBuilder.CreateIndex(
                name: "IX_Notificaciones_Empleado1Id",
                table: "Notificaciones",
                column: "Empleado1Id");

            migrationBuilder.CreateIndex(
                name: "IX_Notificaciones_EmpleadoId",
                table: "Notificaciones",
                column: "EmpleadoId");

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_Empleado1Id",
                table: "Pedidos",
                column: "Empleado1Id");

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_EmpleadoId",
                table: "Pedidos",
                column: "EmpleadoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AsignacionesRolUsuario");

            migrationBuilder.DropTable(
                name: "Notificaciones");

            migrationBuilder.DropTable(
                name: "Pedidos");

            migrationBuilder.DropTable(
                name: "UsuariosDeAcceso");

            migrationBuilder.DropTable(
                name: "RolesDelSistema");

            migrationBuilder.DropTable(
                name: "Empleados");
        }
    }
}
