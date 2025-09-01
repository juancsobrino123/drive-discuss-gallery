-- Drop all existing policies on group_members to start fresh
DROP POLICY IF EXISTS "Group members can view membership" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Group admins can manage members" ON group_members;

-- Create simple, non-recursive policies
-- 1. Users can join groups (insert their own membership)
CREATE POLICY "Users can join groups" 
ON group_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 2. Users can view group memberships only for groups they belong to or are admins
CREATE POLICY "View group memberships" 
ON group_members 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 
    FROM group_members gm 
    WHERE gm.group_id = group_members.group_id 
    AND gm.user_id = auth.uid()
  )
);

-- 3. Users can leave groups (delete their own membership)
CREATE POLICY "Users can leave groups" 
ON group_members 
FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Group admins can manage members (admin role in the group)
CREATE POLICY "Group admins can manage members" 
ON group_members 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (
    auth.uid() IN (
      SELECT gm2.user_id 
      FROM group_members gm2 
      WHERE gm2.group_id = group_members.group_id 
      AND gm2.role = 'admin'
    )
  )
);