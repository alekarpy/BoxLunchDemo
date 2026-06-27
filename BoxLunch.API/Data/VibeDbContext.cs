using Microsoft.EntityFrameworkCore;
using BoxLunch.API.Models;

namespace BoxLunch.API.Data;

public class VibeDbContext(DbContextOptions<VibeDbContext> options) : DbContext(options)
{
    public DbSet<Empleado> Empleados => Set<Empleado>();
    public DbSet<Pedido> Pedidos => Set<Pedido>();
    public DbSet<Notificacion> Notificaciones => Set<Notificacion>();
    public DbSet<RolDelSistema> RolesDelSistema => Set<RolDelSistema>();
    public DbSet<AsignacionRolUsuario> AsignacionesRolUsuario => Set<AsignacionRolUsuario>();
    public DbSet<UsuarioDeAcceso> UsuariosDeAcceso => Set<UsuarioDeAcceso>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Pedido → Empleado (dos relaciones)
        modelBuilder.Entity<Pedido>()
            .HasOne(p => p.Empleado)
            .WithMany(e => e.Pedidos)
            .HasForeignKey(p => p.EmpleadoId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Pedido>()
            .HasOne(p => p.Empleado1)
            .WithMany()
            .HasForeignKey(p => p.Empleado1Id)
            .OnDelete(DeleteBehavior.SetNull);

        // Notificacion → Empleado (dos relaciones)
        modelBuilder.Entity<Notificacion>()
            .HasOne(n => n.Empleado)
            .WithMany(e => e.Notificaciones)
            .HasForeignKey(n => n.EmpleadoId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Notificacion>()
            .HasOne(n => n.Empleado1)
            .WithMany()
            .HasForeignKey(n => n.Empleado1Id)
            .OnDelete(DeleteBehavior.SetNull);

        // Enums stored as strings for readability in SQL
        modelBuilder.Entity<Pedido>()
            .Property(p => p.Estatus)
            .HasConversion<string>();

        modelBuilder.Entity<Pedido>()
            .Property(p => p.MotivoCancelacion)
            .HasConversion<string>();

        modelBuilder.Entity<UsuarioDeAcceso>()
            .Property(u => u.Rol)
            .HasConversion<string>();

        // Seed data: roles básicos
        modelBuilder.Entity<RolDelSistema>().HasData(
            new RolDelSistema { Id = Guid.Parse("11111111-0000-0000-0000-000000000001"), NombreDeRol = "Administrador", Descripcion = "Acceso completo al sistema" },
            new RolDelSistema { Id = Guid.Parse("11111111-0000-0000-0000-000000000002"), NombreDeRol = "Operativo", Descripcion = "Gestión de pedidos y notificaciones" },
            new RolDelSistema { Id = Guid.Parse("11111111-0000-0000-0000-000000000003"), NombreDeRol = "Desarrollador", Descripcion = "Acceso técnico y diagnóstico del sistema" }
        );
    }
}
