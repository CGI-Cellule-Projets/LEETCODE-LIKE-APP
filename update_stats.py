import os
import psycopg2
from psycopg2 import sql

# Database Configuration
DB_CONFIG = {
    "dbname": os.getenv("DB_NAME", "coding_platform_db"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "votre_mot_de_passe"),
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432")
}

def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

def update_problem_solve_rate(conn):
    print("Updating problem solve rates...")
    with conn.cursor() as cur:
        query = """
        WITH total_counts AS (
            SELECT problem_id, COUNT(*) as total_subs
            FROM submissions
            GROUP BY problem_id
        ),
        accepted_counts AS (
            SELECT problem_id, COUNT(*) as accepted_subs
            FROM submissions
            WHERE status = 'Accepted'
            GROUP BY problem_id
        )
        SELECT 
            t.problem_id,
            COALESCE(t.total_subs, 0) as total,
            COALESCE(a.accepted_subs, 0) as accepted
        FROM total_counts t
        LEFT JOIN accepted_counts a ON t.problem_id = a.problem_id;
        """
        cur.execute(query)
        rows = cur.fetchall()
        
        updated_count = 0
        for problem_id, total, accepted in rows:
            solve_rate = round((accepted / total) * 100, 2) if total > 0 else 0.0
            update_sql = "UPDATE problems SET solve_rate = %s WHERE problem_id = %s"
            cur.execute(update_sql, (solve_rate, problem_id))
            updated_count += 1
            
        conn.commit()
    print(f"Updated solve_rate for {updated_count} problems.")

def update_user_levels(conn):
    print("Updating user levels...")
    with conn.cursor() as cur:
        query = """
        SELECT user_id, COUNT(problem_id) as solved_count
        FROM account_problem
        WHERE status = 'solved'
        GROUP BY user_id;
        """
        cur.execute(query)
        rows = cur.fetchall()
        
        updated_count = 0
        for user_id, solved_count in rows:
            new_level = 'beginner'
            if solved_count > 50:
                new_level = 'pro'
            elif solved_count >= 10:
                new_level = 'intermediate'
            
            update_sql = "UPDATE users SET user_level = %s WHERE user_id = %s"
            cur.execute(update_sql, (new_level, user_id))
            updated_count += 1
            
        conn.commit()
    print(f"Updated user_level for {updated_count} users.")

def main():
    conn = get_db_connection()
    if conn:
        try:
            update_problem_solve_rate(conn)
            update_user_levels(conn)
            print("Batch update completed successfully.")
        except Exception as e:
            print(f"An error occurred during update: {e}")
            conn.rollback()
        finally:
            conn.close()

if __name__ == "__main__":
    main()