using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BoxLunch.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialSqlServerFinalV3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "RolesDelSistema",
                keyColumn: "Id",
                keyValue: new Guid("11111111-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "RolesDelSistema",
                keyColumn: "Id",
                keyValue: new Guid("11111111-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "RolesDelSistema",
                keyColumn: "Id",
                keyValue: new Guid("11111111-0000-0000-0000-000000000003"));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "RolesDelSistema",
                columns: new[] { "Id", "Descripcion", "NombreDeRol" },
                values: new object[,]
                {
                    { new Guid("11111111-0000-0000-0000-000000000001"), "Acceso completo al sistema", "Administrador" },
                    { new Guid("11111111-0000-0000-0000-000000000002"), "Gestión de pedidos y notificaciones", "Operativo" },
                    { new Guid("11111111-0000-0000-0000-000000000003"), "Acceso técnico y diagnóstico del sistema", "Desarrollador" }
                });
        }
    }
}
