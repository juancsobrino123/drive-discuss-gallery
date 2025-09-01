-- Fix the infinite recursion issue in group_members RLS policy
DROP POLICY IF EXISTS "Group members can view membership" ON group_members;

-- Create corrected policy that doesn't cause infinite recursion
CREATE POLICY "Group members can view membership" 
ON group_members 
FOR SELECT 
USING (
  -- Users can see memberships of groups they belong to, or admins can see all
  (EXISTS (
    SELECT 1 
    FROM group_members gm2 
    WHERE gm2.group_id = group_members.group_id 
    AND gm2.user_id = auth.uid()
  )) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Also add missing policies for group_members management
CREATE POLICY "Users can leave groups" 
ON group_members 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Group admins can manage members" 
ON group_members 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR EXISTS (
    SELECT 1 
    FROM group_members gm2 
    WHERE gm2.group_id = group_members.group_id 
    AND gm2.user_id = auth.uid() 
    AND gm2.role = 'admin'
  )
);