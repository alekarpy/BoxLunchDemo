using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BoxLunch.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCantidadYNotas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "LugarEntrega",
                table: "Pedidos",
                newName: "Notas");

            migrationBuilder.AddColumn<int>(
                name: "Cantidad",
                table: "Pedidos",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Cantidad",
                table: "Pedidos");

            migrationBuilder.RenameColumn(
                name: "Notas",
                table: "Pedidos",
                newName: "LugarEntrega");
        }
    }
}
