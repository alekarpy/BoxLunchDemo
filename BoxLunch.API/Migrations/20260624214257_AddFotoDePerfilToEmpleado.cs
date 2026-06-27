using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BoxLunch.API.Migrations
{
    /// <inheritdoc />
    public partial class AddFotoDePerfilToEmpleado : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FotoDePerfil",
                table: "Empleados",
                type: "TEXT",
                maxLength: 512,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FotoDePerfil",
                table: "Empleados");
        }
    }
}
