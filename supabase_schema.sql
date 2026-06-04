-- AKTU Tracker Database Schema

-- Table: students
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_number TEXT UNIQUE NOT NULL,
  enrollment_number TEXT,
  name TEXT NOT NULL,
  father_name TEXT,
  branch TEXT CHECK (branch IN ('CSE', 'CSE_AIML', 'CST')),
  gender TEXT,
  has_submitted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: results
CREATE TABLE results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  roll_number TEXT UNIQUE NOT NULL,
  total_semesters_submitted INTEGER,
  overall_sgpa FLOAT,
  total_backs INTEGER DEFAULT 0,
  has_backs BOOLEAN DEFAULT FALSE,
  raw_session_summary TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: semester_results
CREATE TABLE semester_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  roll_number TEXT NOT NULL,
  semester INTEGER NOT NULL,
  sgpa FLOAT,
  total_marks INTEGER,
  result_status TEXT,
  backs_in_sem INTEGER DEFAULT 0,
  date_of_declaration DATE,
  UNIQUE(roll_number, semester)
);

-- Table: subject_marks
CREATE TABLE subject_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  roll_number TEXT NOT NULL,
  semester INTEGER NOT NULL,
  subject_code TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  subject_type TEXT CHECK (subject_type IN ('Theory', 'Practical', 'CA')),
  internal_marks INTEGER,
  external_marks INTEGER,
  total_marks INTEGER,
  grade TEXT,
  is_back BOOLEAN DEFAULT FALSE,
  UNIQUE(roll_number, subject_code)
);
